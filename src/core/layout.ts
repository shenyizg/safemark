/**
 * Pure geometry for placing watermarks. All coordinates are in output pixels with the origin
 * at the top-left corner and y pointing down (canvas convention).
 */

import type { Anchor } from './config'

export interface Size {
  width: number
  height: number
}

export interface Rect extends Size {
  x: number
  y: number
}

export interface Point {
  x: number
  y: number
}

/** A safety net against absurd settings; real configurations stay far below this. */
export const MAX_TILES = 50_000

/** Half extents of the axis-aligned bounding box of a `block` rotated by `angle` radians. */
export function rotatedHalfExtents(block: Size, angle: number): Size {
  const cos = Math.abs(Math.cos(angle))
  const sin = Math.abs(Math.sin(angle))
  return {
    width: (cos * block.width + sin * block.height) / 2,
    height: (sin * block.width + cos * block.height) / 2,
  }
}

export interface TileOptions {
  /** Size of the whole image. The pattern is centered on it. */
  canvas: Size
  /** Unrotated size of one watermark. */
  block: Size
  /** Space between neighbouring blocks, along and across the rotated rows. */
  gapX: number
  gapY: number
  /** Clockwise rotation of the pattern in radians (canvas convention). */
  angle: number
  stagger: boolean
  /** Only blocks that intersect this area are returned. Defaults to the whole canvas. */
  region?: Rect
}

/**
 * Centers of all blocks of a tiled pattern that are (at least partially) visible in `region`.
 *
 * The pattern is a grid in a coordinate system rotated by `angle` around the canvas center, so
 * rows of text run along the rotation. One block always sits exactly at the center, which keeps
 * the pattern symmetric and stable while the user tweaks the settings.
 */
export function tileCenters(options: TileOptions): Point[] {
  const { canvas, block, gapX, gapY, angle, stagger } = options
  const region = options.region ?? { x: 0, y: 0, width: canvas.width, height: canvas.height }
  const cellW = block.width + Math.max(0, gapX)
  const cellH = block.height + Math.max(0, gapY)
  if (!(cellW > 0.5 && cellH > 0.5) || region.width <= 0 || region.height <= 0) return []

  const cx = canvas.width / 2
  const cy = canvas.height / 2
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  // A block is visible iff its center lies in the region grown by the block's rotated half
  // extents. Work with that grown rectangle, relative to the canvas center.
  const half = rotatedHalfExtents(block, angle)
  const x0 = region.x - half.width - cx
  const x1 = region.x + region.width + half.width - cx
  const y0 = region.y - half.height - cy
  const y1 = region.y + region.height + half.height - cy

  // Rows are lines of constant v in the rotated frame (u runs along them). Find the range of
  // rows that can cross the rectangle from its corners.
  let vMin = Infinity
  let vMax = -Infinity
  for (const [dx, dy] of [
    [x0, y0],
    [x1, y0],
    [x0, y1],
    [x1, y1],
  ] as const) {
    const v = -dx * sin + dy * cos
    vMin = Math.min(vMin, v)
    vMax = Math.max(vMax, v)
  }

  const centers: Point[] = []
  for (let row = Math.ceil(vMin / cellH); row <= Math.floor(vMax / cellH); row++) {
    const v = row * cellH
    // Points of this row are (x, y) = (u·cos − v·sin, u·sin + v·cos): intersect the u-ranges
    // for which x and y fall inside the rectangle.
    const ux = axisRange(x0 + v * sin, x1 + v * sin, cos)
    const uy = axisRange(y0 - v * cos, y1 - v * cos, sin)
    const lo = Math.max(ux[0], uy[0])
    const hi = Math.min(ux[1], uy[1])
    if (lo > hi) continue

    const shift = stagger && (row & 1) === 1 ? cellW / 2 : 0
    for (
      let col = Math.ceil((lo - shift) / cellW);
      col <= Math.floor((hi - shift) / cellW);
      col++
    ) {
      const u = col * cellW + shift
      centers.push({ x: cx + u * cos - v * sin, y: cy + u * sin + v * cos })
      if (centers.length >= MAX_TILES) return centers
    }
  }
  return centers
}

/** Values of u for which `lo <= u * k <= hi`. */
function axisRange(lo: number, hi: number, k: number): [number, number] {
  if (Math.abs(k) < 1e-12) return lo <= 0 && hi >= 0 ? [-Infinity, Infinity] : [1, 0]
  const a = lo / k
  const b = hi / k
  return a <= b ? [a, b] : [b, a]
}

export interface SingleOptions {
  canvas: Size
  block: Size
  /** Clockwise rotation in radians (canvas convention). */
  angle: number
  anchor: Anchor
  /** Distance between the rotated block and the canvas edge, in pixels. */
  margin: number
  /** Center for the `custom` anchor, as fractions of the canvas size. */
  position: Point
}

const ANCHOR_FRACTIONS: Record<Exclude<Anchor, 'custom'>, [number, number]> = {
  'top-left': [0, 0],
  top: [0.5, 0],
  'top-right': [1, 0],
  left: [0, 0.5],
  center: [0.5, 0.5],
  right: [1, 0.5],
  'bottom-left': [0, 1],
  bottom: [0.5, 1],
  'bottom-right': [1, 1],
}

/** Center of a single watermark so that its rotated bounding box respects the anchor/margin. */
export function singleCenter(options: SingleOptions): Point {
  const { canvas, block, angle, anchor, margin, position } = options
  if (anchor === 'custom') {
    return { x: position.x * canvas.width, y: position.y * canvas.height }
  }
  const half = rotatedHalfExtents(block, angle)
  const [fx, fy] = ANCHOR_FRACTIONS[anchor]
  const along = (fraction: number, length: number, extent: number) =>
    fraction === 0 ? margin + extent : fraction === 1 ? length - margin - extent : length / 2
  return {
    x: along(fx, canvas.width, half.width),
    y: along(fy, canvas.height, half.height),
  }
}
