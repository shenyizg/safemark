import { allocCanvas, canEncode, canvasToBlob, releaseCanvas } from './canvas'
import type { ExportOptions, WatermarkConfig } from './config'
import { drawWatermark, type WatermarkContent } from './render'

export class ImageDecodeError extends Error {
  constructor() {
    super('This image format is not supported by your browser')
    this.name = 'ImageDecodeError'
  }
}

export interface DecodedImage {
  image: HTMLImageElement
  width: number
  height: number
  /** Revokes the object URL backing the image. */
  dispose(): void
}

/**
 * Decodes an image file. An `<img>` element is used rather than `createImageBitmap` because it
 * applies the EXIF orientation of photos consistently across browsers.
 */
export async function decodeImage(file: Blob): Promise<DecodedImage> {
  const url = URL.createObjectURL(file)
  const image = new Image()
  image.decoding = 'async'
  image.src = url
  try {
    await image.decode()
  } catch {
    URL.revokeObjectURL(url)
    throw new ImageDecodeError()
  }
  // SVGs without an intrinsic size report 0×0.
  const width = image.naturalWidth || 1024
  const height = image.naturalHeight || (image.naturalWidth ? image.naturalWidth : 1024)
  return { image, width, height, dispose: () => URL.revokeObjectURL(url) }
}

/** Draws `source` scaled to fit within `maxSide`; used for thumbnails and preview bitmaps. */
export function scaledCopy(
  source: CanvasImageSource,
  width: number,
  height: number,
  maxSide: number,
): HTMLCanvasElement {
  const scale = Math.min(1, maxSide / Math.max(width, height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width * scale))
  canvas.height = Math.max(1, Math.round(height * scale))
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
  return canvas
}

const ENCODABLE: Record<string, string> = {
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

/** The MIME type to export an image as, honoring the user's choice and browser support. */
export async function outputType(sourceType: string, options: ExportOptions): Promise<string> {
  const wanted =
    options.imageFormat === 'original'
      ? ENCODABLE[sourceType]
        ? sourceType
        : 'image/png'
      : `image/${options.imageFormat}`
  return (await canEncode(wanted)) ? wanted : 'image/png'
}

export interface RenderedImage {
  blob: Blob
  width: number
  height: number
  /** Below 1 if the image had to be downscaled to fit the browser's canvas limits. */
  scale: number
}

export async function watermarkImage(
  file: File,
  config: WatermarkConfig,
  content: WatermarkContent,
  options: ExportOptions,
): Promise<RenderedImage> {
  const decoded = await decodeImage(file)
  try {
    const type = await outputType(file.type, options)
    const { canvas, ctx, scale } = allocCanvas(decoded.width, decoded.height)
    try {
      if (type === 'image/jpeg') {
        // JPEG has no alpha channel: put transparent areas on white instead of black.
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(decoded.image, 0, 0, canvas.width, canvas.height)
      drawWatermark(ctx, canvas, config, content)
      const quality = type === 'image/png' ? undefined : options.quality / 100
      const blob = await canvasToBlob(canvas, type, quality)
      return { blob, width: canvas.width, height: canvas.height, scale }
    } finally {
      releaseCanvas(canvas)
    }
  } finally {
    decoded.dispose()
  }
}
