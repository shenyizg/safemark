import { PDFDocument, PDFName, degrees } from 'pdf-lib'
import { describe, expect, it, vi } from 'vitest'

import type { Size } from '../layout'
import {
  normalizeRotation,
  overlayPlacement,
  PdfEncryptedError,
  visibleBox,
  watermarkPdfOverlay,
  type PageBox,
  type PageRotation,
} from '../pdf'

// A 1×1 transparent PNG.
const PNG = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  ),
  (c) => c.charCodeAt(0),
)

describe('normalizeRotation', () => {
  it('maps any multiple of 90° to 0–270', () => {
    expect(normalizeRotation(0)).toBe(0)
    expect(normalizeRotation(-90)).toBe(270)
    expect(normalizeRotation(450)).toBe(90)
    expect(normalizeRotation(-540)).toBe(180)
    expect(normalizeRotation(89)).toBe(90)
  })
})

describe('visibleBox', () => {
  const media = { x: 0, y: 0, width: 600, height: 800 }

  it('uses the crop box when it lies within the media box', () => {
    const crop = { x: 50, y: 60, width: 300, height: 400 }
    expect(visibleBox(media, crop)).toEqual(crop)
  })

  it('limits the crop box to the media box', () => {
    expect(visibleBox(media, { x: -100, y: 700, width: 300, height: 300 })).toEqual({
      x: 0,
      y: 700,
      width: 200,
      height: 100,
    })
  })

  it('accepts boxes given with swapped corners', () => {
    expect(visibleBox({ x: 600, y: 800, width: -600, height: -800 }, media)).toEqual(media)
  })

  it('falls back to the media box when the boxes do not overlap', () => {
    expect(visibleBox(media, { x: 1000, y: 1000, width: 10, height: 10 })).toEqual(media)
  })
})

describe('overlayPlacement', () => {
  /** Corners of the drawn image in user space, using pdf-lib's drawImage transform. */
  function drawnCorners(p: ReturnType<typeof overlayPlacement>) {
    const a = (p.rotate * Math.PI) / 180
    const map = (u: number, v: number) => ({
      x: Math.round(p.x + u * p.width * Math.cos(a) - v * p.height * Math.sin(a)),
      y: Math.round(p.y + u * p.width * Math.sin(a) + v * p.height * Math.cos(a)),
    })
    return [map(0, 0), map(1, 0), map(0, 1), map(1, 1)]
  }

  function boxCorners(b: PageBox) {
    return [
      { x: b.x, y: b.y },
      { x: b.x + b.width, y: b.y },
      { x: b.x, y: b.y + b.height },
      { x: b.x + b.width, y: b.y + b.height },
    ]
  }

  const sortPoints = (points: { x: number; y: number }[]) =>
    [...points].sort((p, q) => p.x - q.x || p.y - q.y)

  for (const rotation of [0, 90, 180, 270] as PageRotation[]) {
    it(`covers the visible area of a page rotated by ${rotation}°`, () => {
      const box = { x: 30, y: 40, width: 500, height: 700 }
      const placement = overlayPlacement(box, rotation)
      expect(sortPoints(drawnCorners(placement))).toEqual(sortPoints(boxCorners(box)))
      // The image keeps the displayed orientation of the page.
      const sideways = rotation % 180 !== 0
      expect(placement.width).toBe(sideways ? 700 : 500)
      expect(placement.height).toBe(sideways ? 500 : 700)
      // Viewers rotate clockwise by /Rotate; the image is rotated back by the same angle.
      expect(placement.rotate).toBe(rotation)
    })
  }
})

async function samplePdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.addPage([595, 842])
  doc.addPage([595, 842])
  doc.addPage([842, 595])
  const rotated = doc.addPage([595, 842])
  rotated.setRotation(degrees(90))
  const cropped = doc.addPage([595, 842])
  cropped.setCropBox(50, 50, 400, 600)
  return doc.save()
}

describe('watermarkPdfOverlay', () => {
  it('adds an image to every page, sharing it between pages of the same size', async () => {
    const renderLayer = vi.fn<(size: Size, index: number) => Promise<Uint8Array>>(async () => PNG)
    const onProgress = vi.fn()
    const output = await watermarkPdfOverlay(await samplePdf(), {
      renderLayer,
      perPage: false,
      onProgress,
    })

    // 595×842 (pages 1, 2 and the rotated page shown as 842×595 shares with page 3), 400×600.
    expect(renderLayer.mock.calls.map(([size]) => [size.width, size.height])).toEqual([
      [595, 842],
      [842, 595],
      [400, 600],
    ])
    expect(onProgress).toHaveBeenLastCalledWith(5, 5)

    const result = await PDFDocument.load(output)
    expect(result.getPageCount()).toBe(5)
    for (const page of result.getPages()) {
      const xObjects = page.node.Resources()?.lookup(PDFName.of('XObject'))
      expect(xObjects).toBeDefined()
    }
  })

  it('renders a layer per page when the text depends on the page', async () => {
    const renderLayer = vi.fn<(size: Size, index: number) => Promise<Uint8Array>>(async () => PNG)
    await watermarkPdfOverlay(await samplePdf(), { renderLayer, perPage: true })
    expect(renderLayer.mock.calls.map(([, index]) => index)).toEqual([0, 1, 2, 3, 4])
  })

  it('stops when aborted', async () => {
    const controller = new AbortController()
    controller.abort()
    await expect(
      watermarkPdfOverlay(await samplePdf(), {
        renderLayer: async () => PNG,
        perPage: false,
        signal: controller.signal,
      }),
    ).rejects.toThrow()
  })

  it('reports encrypted documents', async () => {
    const doc = await PDFDocument.create()
    doc.addPage()
    doc.context.trailerInfo.Encrypt = doc.context.obj({ Filter: 'Standard', V: 2, R: 3 })
    const bytes = await doc.save({ useObjectStreams: false })
    await expect(
      watermarkPdfOverlay(bytes, { renderLayer: async () => PNG, perPage: false }),
    ).rejects.toBeInstanceOf(PdfEncryptedError)
  })
})
