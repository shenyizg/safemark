/** Canvas helpers that cope with browser limits on canvas size and encoding support. */

export class CanvasTooLargeError extends Error {
  constructor() {
    super('The image is too large for this browser to process')
    this.name = 'CanvasTooLargeError'
  }
}

export interface AllocatedCanvas {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  /** 1 unless the requested size had to be reduced to fit the browser's limits. */
  scale: number
}

const MAX_SIDE = 32_767

/**
 * Browsers silently hand out unusable canvases beyond their (undocumented, device dependent)
 * size limits — e.g. about 16.7 megapixels on many iPhones. Allocate the requested size if it
 * works, otherwise step down until it does.
 */
export function allocCanvas(width: number, height: number): AllocatedCanvas {
  let scale = Math.min(1, MAX_SIDE / width, MAX_SIDE / height)
  for (let attempt = 0; attempt < 16; attempt++, scale *= 0.85) {
    const w = Math.max(1, Math.round(width * scale))
    const h = Math.max(1, Math.round(height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (ctx && isUsable(ctx, w, h)) return { canvas, ctx, scale }
    releaseCanvas(canvas)
  }
  throw new CanvasTooLargeError()
}

/** Whether drawing on the canvas works: oversized canvases silently ignore every operation. */
export function isUsable(ctx: CanvasRenderingContext2D, w: number, h: number): boolean {
  try {
    ctx.fillStyle = '#000'
    ctx.fillRect(w - 1, h - 1, 1, 1)
    const ok = ctx.getImageData(w - 1, h - 1, 1, 1).data[3] === 255
    ctx.clearRect(w - 1, h - 1, 1, 1)
    return ok
  } catch {
    return false
  }
}

export function releaseCanvas(canvas: HTMLCanvasElement): void {
  canvas.width = 0
  canvas.height = 0
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to encode the image'))),
      type,
      quality,
    )
  })
}

const encodeSupport = new Map<string, boolean>()

/** Whether `canvas.toBlob` can produce `type` (Safari, for instance, cannot encode WebP). */
export async function canEncode(type: string): Promise<boolean> {
  const known = encodeSupport.get(type)
  if (known !== undefined) return known
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  let supported = false
  try {
    supported = (await canvasToBlob(canvas, type)).type === type
  } catch {
    supported = false
  }
  encodeSupport.set(type, supported)
  return supported
}
