/**
 * PDF support. pdf.js renders pages (preview and "flatten" export), pdf-lib edits documents
 * ("overlay" export). Both are loaded on demand, the first time a PDF is used.
 */

import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import type { PDFImage, PDFPage } from 'pdf-lib'

import { allocCanvas, canvasToBlob, releaseCanvas } from './canvas'
import type { Size } from './layout'

type Pdfjs = typeof import('pdfjs-dist')

export class PdfPasswordError extends Error {
  constructor() {
    super('A password is required to open this PDF')
    this.name = 'PdfPasswordError'
  }
}

export class PdfEncryptedError extends Error {
  constructor() {
    super('Encrypted PDFs cannot be modified in place')
    this.name = 'PdfEncryptedError'
  }
}

let pdfjsPromise: Promise<Pdfjs> | null = null

export function loadPdfjs(): Promise<Pdfjs> {
  pdfjsPromise ??= Promise.all([
    import('pdfjs-dist/legacy/build/pdf.mjs'),
    import('./pdf.worker?worker&url'),
  ])
    .then(([lib, worker]) => {
      lib.GlobalWorkerOptions.workerSrc = worker.default
      return lib
    })
    .catch((error: unknown) => {
      pdfjsPromise = null
      throw error
    })
  return pdfjsPromise
}

/** pdf.js fetches these on demand from our own origin; absolute because the worker fetches. */
function assetUrl(path: string): string {
  return new URL(`${import.meta.env.BASE_URL}pdfjs/${path}`, document.baseURI).href
}

export interface OpenPdfOptions {
  /** Password to try first, e.g. one the user entered earlier for the same file. */
  password?: string
  /** Asks the user for the password; resolves to `null` if they give up. */
  requestPassword?: (retry: boolean) => Promise<string | null>
}

/** Opens a PDF with pdf.js. Note that `data` is transferred to the worker and detached. */
export async function openPdf(
  data: Uint8Array,
  options: OpenPdfOptions = {},
): Promise<PDFDocumentProxy> {
  const lib = await loadPdfjs()
  const task = lib.getDocument({
    data,
    cMapUrl: assetUrl('cmaps/'),
    cMapPacked: true,
    standardFontDataUrl: assetUrl('standard_fonts/'),
    wasmUrl: assetUrl('wasm/'),
    iccUrl: assetUrl('iccs/'),
    password: options.password,
  })
  let gaveUp = false
  task.onPassword = (update: (password: string) => void, reason: number) => {
    const ask = options.requestPassword ?? (() => Promise.resolve(null))
    void ask(reason === lib.PasswordResponses.INCORRECT_PASSWORD).then((password) => {
      if (password === null) {
        gaveUp = true
        void task.destroy()
      } else {
        update(password)
      }
    })
  }
  try {
    return await task.promise
  } catch (error) {
    if (gaveUp) throw new PdfPasswordError()
    throw error
  }
}

export interface PageRender {
  promise: Promise<HTMLCanvasElement>
  cancel(): void
}

/** Renders a page at `scale` (1 = 72 dpi) into a new canvas, for previews and thumbnails. */
export function renderPage(page: PDFPageProxy, scale: number): PageRender {
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.floor(viewport.width))
  canvas.height = Math.max(1, Math.floor(viewport.height))
  const task = page.render({ canvas, viewport })
  return {
    promise: task.promise.then(
      () => canvas,
      (error: unknown) => {
        releaseCanvas(canvas)
        throw error
      },
    ),
    cancel: () => task.cancel(),
  }
}

export interface PageBox {
  x: number
  y: number
  width: number
  height: number
}

export type PageRotation = 0 | 90 | 180 | 270

export function normalizeRotation(angle: number): PageRotation {
  return ((((Math.round(angle / 90) * 90) % 360) + 360) % 360) as PageRotation
}

/** Normalizes a box whose corners may be given in any order. */
function normalizeBox(box: PageBox): PageBox {
  return {
    x: Math.min(box.x, box.x + box.width),
    y: Math.min(box.y, box.y + box.height),
    width: Math.abs(box.width),
    height: Math.abs(box.height),
  }
}

/** The visible area of a page: its crop box, limited to the media box. */
export function visibleBox(mediaBox: PageBox, cropBox: PageBox): PageBox {
  const media = normalizeBox(mediaBox)
  const crop = normalizeBox(cropBox)
  const x = Math.max(media.x, crop.x)
  const y = Math.max(media.y, crop.y)
  const width = Math.min(media.x + media.width, crop.x + crop.width) - x
  const height = Math.min(media.y + media.height, crop.y + crop.height) - y
  return width > 0 && height > 0 ? { x, y, width, height } : media
}

export interface OverlayPlacement {
  x: number
  y: number
  /** Size of the image as displayed, i.e. of the page in its viewing orientation. */
  width: number
  height: number
  /** Counter-clockwise rotation of the image around (x, y), in degrees. */
  rotate: PageRotation
}

/**
 * Where to draw a full-page overlay image in a page's user space so that it covers the
 * visible area and reads upright: viewers rotate pages clockwise by /Rotate, and pdf-lib
 * rotates images counter-clockwise around their bottom-left corner.
 */
export function overlayPlacement(box: PageBox, rotation: PageRotation): OverlayPlacement {
  const sideways = rotation === 90 || rotation === 270
  const width = sideways ? box.height : box.width
  const height = sideways ? box.width : box.height
  const x = rotation === 90 || rotation === 180 ? box.x + box.width : box.x
  const y = rotation === 180 || rotation === 270 ? box.y + box.height : box.y
  return { x, y, width, height, rotate: rotation }
}

function pagePlacement(page: PDFPage): OverlayPlacement {
  const box = visibleBox(page.getMediaBox(), page.getCropBox())
  return overlayPlacement(box, normalizeRotation(page.getRotation().angle))
}

export interface ProgressOptions {
  onProgress?: (done: number, total: number) => void
  signal?: AbortSignal
}

export interface OverlayOptions extends ProgressOptions {
  /** Renders the transparent watermark (PNG) for a page of `size` points, upright. */
  renderLayer: (size: Size, pageIndex: number) => Promise<Uint8Array>
  /** Whether every page needs its own layer (otherwise layers are shared per page size). */
  perPage: boolean
}

/**
 * Adds the watermark on top of every page of the original document. Text, links, bookmarks
 * and forms are preserved.
 */
export async function watermarkPdfOverlay(
  bytes: Uint8Array,
  options: OverlayOptions,
): Promise<Uint8Array> {
  const { PDFDocument, degrees } = await import('pdf-lib')
  // pdf-lib's own errors cannot be told apart with `instanceof` (they are compiled to ES5),
  // so load leniently and check the flag instead.
  const doc = await PDFDocument.load(bytes, { updateMetadata: false, ignoreEncryption: true })
  if (doc.isEncrypted) throw new PdfEncryptedError()

  const pages = doc.getPages()
  // Pages of the same size share one embedded image, which keeps the file small.
  const layers = new Map<string, PDFImage>()
  for (const [index, page] of pages.entries()) {
    options.signal?.throwIfAborted()
    const placement = pagePlacement(page)
    const key = options.perPage
      ? `page-${index}`
      : `${placement.width.toFixed(2)}x${placement.height.toFixed(2)}`
    let image = layers.get(key)
    if (!image) {
      const png = await options.renderLayer(
        { width: placement.width, height: placement.height },
        index,
      )
      image = await doc.embedPng(png)
      layers.set(key, image)
    }
    page.drawImage(image, {
      x: placement.x,
      y: placement.y,
      width: placement.width,
      height: placement.height,
      rotate: degrees(placement.rotate),
    })
    options.onProgress?.(index + 1, pages.length)
  }
  options.signal?.throwIfAborted()
  return doc.save()
}

export interface FlattenOptions extends ProgressOptions {
  dpi: number
  /** JPEG quality of the page images, 0–1. */
  quality: number
  /** Draws the watermark onto a rendered page (`size` in pixels). */
  paint: (ctx: CanvasRenderingContext2D, size: Size, pageIndex: number) => void
}

/**
 * Renders every page to an image with the watermark burned in and assembles a new PDF from
 * them. Text is no longer selectable, but the watermark cannot be removed by editing the PDF.
 */
export async function watermarkPdfFlatten(
  source: PDFDocumentProxy,
  options: FlattenOptions,
): Promise<Uint8Array> {
  const { PDFDocument } = await import('pdf-lib')
  const out = await PDFDocument.create()
  out.setProducer('SafeMark')
  out.setCreator('SafeMark')
  try {
    const { info } = (await source.getMetadata()) as { info?: Record<string, unknown> }
    if (typeof info?.Title === 'string' && info.Title) out.setTitle(info.Title)
    if (typeof info?.Author === 'string' && info.Author) out.setAuthor(info.Author)
  } catch {
    // Metadata is optional.
  }

  const total = source.numPages
  for (let number = 1; number <= total; number++) {
    options.signal?.throwIfAborted()
    const page = await source.getPage(number)
    try {
      // Page size in points (with rotation and UserUnit applied).
      const size = page.getViewport({ scale: 1 })
      const pxPerPt = options.dpi / 72
      const { canvas, ctx, scale } = allocCanvas(size.width * pxPerPt, size.height * pxPerPt)
      try {
        const viewport = page.getViewport({ scale: pxPerPt * scale })
        await page.render({ canvas, viewport }).promise
        options.paint(ctx, canvas, number - 1)
        const jpeg = await canvasToBlob(canvas, 'image/jpeg', options.quality)
        const image = await out.embedJpg(new Uint8Array(await jpeg.arrayBuffer()))
        out
          .addPage([size.width, size.height])
          .drawImage(image, { x: 0, y: 0, width: size.width, height: size.height })
      } finally {
        releaseCanvas(canvas)
      }
    } finally {
      page.cleanup()
    }
    options.onProgress?.(number, total)
  }
  options.signal?.throwIfAborted()
  return out.save()
}
