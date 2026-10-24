/**
 * Low-resolution renditions of the active file for the live preview. The watermark itself is
 * drawn on top at display resolution on every change, so these only depend on the file, the
 * page and (roughly) the preview size.
 */

import { watch } from 'vue'

import { releaseCanvas } from '@/core/canvas'
import { decodeImage, scaledCopy } from '@/core/image'
import { renderPage } from '@/core/pdf'
import { items, withPdfDocument, type FileItem } from './files'

/** Renditions are kept within this many pixels (~4 bytes each), oldest dropped first. */
const CACHE_PIXELS = 24_000_000

interface Entry {
  promise: Promise<HTMLCanvasElement>
  pixels: number
}

const cache = new Map<string, Entry>()
/** The rendition last handed out is on screen and must not be released. */
let inUse: HTMLCanvasElement | null = null

/** Rounds requested sizes up to steps so small resizes reuse the cached rendition. */
function bucket(pixels: number): number {
  return Math.min(3072, Math.max(512, Math.ceil(pixels / 512) * 512))
}

function evict(key: string) {
  const entry = cache.get(key)
  if (!entry) return
  cache.delete(key)
  void entry.promise.then(
    (canvas) => canvas !== inUse && releaseCanvas(canvas),
    () => {},
  )
}

function trim() {
  let total = 0
  for (const entry of cache.values()) total += entry.pixels
  for (const key of cache.keys()) {
    if (total <= CACHE_PIXELS || cache.size <= 1) break
    total -= cache.get(key)!.pixels
    evict(key)
  }
}

/**
 * A rendition of `item` (page `page` for PDFs) whose longer side is at least `longSide`
 * pixels where the source allows it.
 */
export async function previewBase(
  item: FileItem,
  page: number,
  longSide: number,
): Promise<HTMLCanvasElement> {
  const size = bucket(longSide)
  const key = `${item.id}:${page}:${size}`
  let entry = cache.get(key)
  if (entry) {
    // Move to the end: most recently used.
    cache.delete(key)
    cache.set(key, entry)
  } else {
    const promise =
      item.kind === 'image' ? renderImage(item, size) : renderPdfPage(item, page, size)
    entry = { promise, pixels: size * size }
    cache.set(key, entry)
    promise.then(
      (canvas) => {
        entry!.pixels = canvas.width * canvas.height
        trim()
      },
      () => cache.delete(key),
    )
  }
  const canvas = await entry.promise
  inUse = canvas
  return canvas
}

async function renderImage(item: FileItem, size: number): Promise<HTMLCanvasElement> {
  const decoded = await decodeImage(item.file)
  try {
    return scaledCopy(decoded.image, decoded.width, decoded.height, size)
  } finally {
    decoded.dispose()
  }
}

function renderPdfPage(item: FileItem, number: number, size: number) {
  return withPdfDocument(item, async (doc) => {
    const page = await doc.getPage(Math.min(Math.max(1, number), doc.numPages))
    const viewport = page.getViewport({ scale: 1 })
    return renderPage(page, size / Math.max(viewport.width, viewport.height)).promise
  })
}

/** Size of a PDF page in points, with its rotation applied. */
export function pdfPageSize(item: FileItem, number: number) {
  return withPdfDocument(item, async (doc) => {
    const page = await doc.getPage(Math.min(Math.max(1, number), doc.numPages))
    const { width, height } = page.getViewport({ scale: 1 })
    return { width, height }
  })
}

function forget(itemId: string) {
  for (const key of [...cache.keys()]) if (key.startsWith(`${itemId}:`)) evict(key)
}

watch(
  () => items.map((item) => item.id),
  (ids, previous) => previous.filter((id) => !ids.includes(id)).forEach(forget),
)
