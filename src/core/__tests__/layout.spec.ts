import { describe, expect, it } from 'vitest'

import {
  MAX_TILES,
  rotatedHalfExtents,
  singleCenter,
  tileCenters,
  type Point,
  type Rect,
  type TileOptions,
} from '../layout'

/** Straightforward reference implementation: enumerate a generous grid, keep visible blocks. */
function bruteForce(options: TileOptions): Point[] {
  const { canvas, block, gapX, gapY, angle, stagger } = options
  const region: Rect = options.region ?? { x: 0, y: 0, ...canvas }
  const cellW = block.width + gapX
  const cellH = block.height + gapY
  const half = rotatedHalfExtents(block, angle)
  const span = Math.ceil((Math.hypot(canvas.width, canvas.height) * 2) / Math.min(cellW, cellH)) + 4
  const result: Point[] = []
  for (let row = -span; row <= span; row++) {
    const shift = stagger && (row & 1) === 1 ? cellW / 2 : 0
    for (let col = -span; col <= span; col++) {
      const u = col * cellW + shift
      const v = row * cellH
      const x = canvas.width / 2 + u * Math.cos(angle) - v * Math.sin(angle)
      const y = canvas.height / 2 + u * Math.sin(angle) + v * Math.cos(angle)
      if (
        x + half.width >= region.x &&
        x - half.width <= region.x + region.width &&
        y + half.height >= region.y &&
        y - half.height <= region.y + region.height
      ) {
        result.push({ x, y })
      }
    }
  }
  return result
}

const key = (p: Point) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`

describe('tileCenters', () => {
  const canvas = { width: 1200, height: 800 }
  const block = { width: 180, height: 40 }

  for (const degrees of [0, 17, 30, 45, 90, -60, 135, 180]) {
    for (const stagger of [false, true]) {
      it(`matches the reference at ${degrees}° (stagger: ${stagger})`, () => {
        const options: TileOptions = {
          canvas,
          block,
          gapX: 60,
          gapY: 70,
          angle: (degrees * Math.PI) / 180,
          stagger,
        }
        const fast = new Set(tileCenters(options).map(key))
        const slow = new Set(bruteForce(options).map(key))
        expect(fast.size).toBeGreaterThan(0)
        // The fast path may only differ on exact boundary touches.
        for (const p of fast) expect(slow.has(p)).toBe(true)
        expect(slow.size - fast.size).toBeLessThanOrEqual(2)
      })
    }
  }

  it('limits results to a region (bands of a large image)', () => {
    const options: TileOptions = { canvas, block, gapX: 40, gapY: 40, angle: 0.5, stagger: true }
    const all = new Set(tileCenters(options).map(key))
    const bands = [0, 200, 400, 600].flatMap((y) =>
      tileCenters({ ...options, region: { x: 0, y, width: canvas.width, height: 200 } }),
    )
    // Every block is drawn by at least one band, and bands draw nothing outside the pattern.
    for (const p of bands) expect(all.has(key(p))).toBe(true)
    expect(new Set(bands.map(key)).size).toBe(all.size)
  })

  it('puts one block exactly at the center', () => {
    const centers = tileCenters({ canvas, block, gapX: 50, gapY: 50, angle: 0.3, stagger: true })
    expect(centers.some((p) => Math.abs(p.x - 600) < 1e-9 && Math.abs(p.y - 400) < 1e-9)).toBe(true)
  })

  it('returns nothing for an empty block or region', () => {
    expect(
      tileCenters({
        canvas,
        block: { width: 0, height: 0 },
        gapX: 0,
        gapY: 0,
        angle: 0,
        stagger: false,
      }),
    ).toEqual([])
    expect(
      tileCenters({
        canvas,
        block,
        gapX: 0,
        gapY: 0,
        angle: 0,
        stagger: false,
        region: { x: 0, y: 0, width: 0, height: 10 },
      }),
    ).toEqual([])
  })

  it('caps the number of blocks', () => {
    const centers = tileCenters({
      canvas: { width: 20_000, height: 20_000 },
      block: { width: 4, height: 4 },
      gapX: 0,
      gapY: 0,
      angle: 0,
      stagger: false,
    })
    expect(centers.length).toBe(MAX_TILES)
  })
})

describe('rotatedHalfExtents', () => {
  it('swaps width and height at 90°', () => {
    const half = rotatedHalfExtents({ width: 100, height: 20 }, Math.PI / 2)
    expect(half.width).toBeCloseTo(10)
    expect(half.height).toBeCloseTo(50)
  })

  it('grows at 45°', () => {
    const half = rotatedHalfExtents({ width: 100, height: 100 }, Math.PI / 4)
    expect(half.width).toBeCloseTo(Math.SQRT2 * 50)
  })
})

describe('singleCenter', () => {
  const base = {
    canvas: { width: 1000, height: 500 },
    block: { width: 200, height: 50 },
    angle: 0,
    margin: 20,
    position: { x: 0.25, y: 0.75 },
  }

  it('honours anchors and margins', () => {
    expect(singleCenter({ ...base, anchor: 'top-left' })).toEqual({ x: 120, y: 45 })
    expect(singleCenter({ ...base, anchor: 'bottom-right' })).toEqual({ x: 880, y: 455 })
    expect(singleCenter({ ...base, anchor: 'center' })).toEqual({ x: 500, y: 250 })
    expect(singleCenter({ ...base, anchor: 'top' })).toEqual({ x: 500, y: 45 })
  })

  it('keeps the rotated block inside the margin', () => {
    const c = singleCenter({ ...base, anchor: 'top-left', angle: Math.PI / 2 })
    expect(c.x).toBeCloseTo(20 + 25)
    expect(c.y).toBeCloseTo(20 + 100)
  })

  it('uses the free position for the custom anchor', () => {
    expect(singleCenter({ ...base, anchor: 'custom' })).toEqual({ x: 250, y: 375 })
  })
})
