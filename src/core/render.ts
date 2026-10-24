/**
 * Draws a watermark onto a canvas. The live preview and every export path use this one
 * function, so what you see is exactly what you get — just at a different resolution.
 */

import type { WatermarkConfig } from './config'
import { singleCenter, tileCenters, type Point, type Rect, type Size } from './layout'

export interface LogoAsset {
  source: CanvasImageSource
  width: number
  height: number
}

export interface WatermarkContent {
  /** Text with template variables already resolved. */
  text: string
  logo?: LogoAsset | null
}

/**
 * The watermark is first drawn opaque onto a separate layer which is then composited with the
 * configured opacity (and shadow). This keeps overlapping strokes, fills and tiles from
 * stacking up into darker spots. Huge images are processed in horizontal bands so the layer
 * never needs more than this many pixels.
 */
const MAX_LAYER_PIXELS = 8_000_000
const MAX_CANVAS_SIDE = 32_767

const GENERIC_FAMILIES = new Set([
  'serif',
  'sans-serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
  'ui-serif',
  'ui-sans-serif',
  'ui-monospace',
  'ui-rounded',
])

/** A CSS `font-family` value for a single family name, with a generic fallback. */
export function cssFontFamily(family: string): string {
  if (GENERIC_FAMILIES.has(family)) return family
  return `"${family.replace(/["\\]/g, '\\$&')}", sans-serif`
}

export function cssFont(config: WatermarkConfig, sizePx: number): string {
  const style = config.italic ? 'italic ' : ''
  return `${style}${config.fontWeight} ${sizePx}px ${cssFontFamily(config.fontFamily)}`
}

const segmenter =
  typeof Intl !== 'undefined' && 'Segmenter' in Intl
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : null

function graphemes(text: string): string[] {
  return segmenter ? Array.from(segmenter.segment(text), (s) => s.segment) : Array.from(text)
}

const nativeLetterSpacing =
  typeof CanvasRenderingContext2D !== 'undefined' &&
  'letterSpacing' in CanvasRenderingContext2D.prototype

interface TextLine {
  text: string
  width: number
  /** Per-character advances, only when letter spacing has to be emulated. */
  glyphs: { text: string; advance: number }[] | null
}

interface Frame {
  /** Size of the border's center line. */
  width: number
  height: number
  line: number
}

interface Metrics {
  /** Outer size of one watermark, used for spacing and positioning. */
  block: Size
  /** Reference length for gaps and effects: the font size, or the logo's shorter side. */
  unit: number
  fontPx: number
  spacingPx: number
  lineHeightPx: number
  lines: TextLine[]
  frame: Frame | null
}

let measureContext: CanvasRenderingContext2D | null = null

function measure(config: WatermarkConfig, content: WatermarkContent, size: Size): Metrics | null {
  const shorter = Math.min(size.width, size.height)
  if (!(shorter > 0)) return null

  if (config.kind === 'image') {
    const logo = content.logo
    if (!logo || !(logo.width > 0) || !(logo.height > 0)) return null
    const width = (config.imageSize / 100) * shorter
    const height = (width * logo.height) / logo.width
    return {
      block: { width, height },
      unit: Math.min(width, height),
      fontPx: 0,
      spacingPx: 0,
      lineHeightPx: 0,
      lines: [],
      frame: null,
    }
  }

  const rawLines = content.text.replace(/\r\n?/g, '\n').split('\n')
  if (!rawLines.some((line) => line.trim())) return null

  measureContext ??= document.createElement('canvas').getContext('2d')
  const ctx = measureContext
  if (!ctx) throw new Error('Canvas 2D is not available')

  const fontPx = Math.max(1, (config.fontSize / 100) * shorter)
  const spacingPx = config.letterSpacing * fontPx
  const emulate = spacingPx !== 0 && !nativeLetterSpacing
  ctx.font = cssFont(config, fontPx)
  if (nativeLetterSpacing) ctx.letterSpacing = '0px'

  const lines = rawLines.map((text): TextLine => {
    const chars = graphemes(text)
    if (emulate) {
      const glyphs = chars.map((g) => ({ text: g, advance: ctx.measureText(g).width + spacingPx }))
      const width = glyphs.reduce((sum, g) => sum + g.advance, 0) - (chars.length ? spacingPx : 0)
      return { text, width: Math.max(0, width), glyphs }
    }
    // Measured without spacing, which is then added between characters: browsers disagree on
    // whether the spacing after the last character is part of the measured width.
    const width = ctx.measureText(text).width + Math.max(0, chars.length - 1) * spacingPx
    return { text, width: Math.max(0, width), glyphs: null }
  })

  const lineHeightPx = config.lineHeight * fontPx
  const textWidth = Math.max(...lines.map((line) => line.width))
  let block = { width: textWidth, height: lines.length * lineHeightPx }
  let frame: Frame | null = null
  if (config.frameEnabled) {
    const line = (config.frameWidth / 100) * fontPx
    const padding = config.framePadding * fontPx
    // Measured from the glyphs' em boxes rather than the line boxes, so the padding looks even.
    const inkHeight = (lines.length - 1) * lineHeightPx + fontPx
    frame = {
      width: textWidth + 2 * padding + line,
      height: inkHeight + 2 * padding + line,
      line,
    }
    block = { width: frame.width + line, height: frame.height + line }
  }
  return { block, unit: fontPx, fontPx, spacingPx, lineHeightPx, lines, frame }
}

type PaintText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number) => void

const fillText: PaintText = (ctx, text, x, y) => ctx.fillText(text, x, y)
const strokeText: PaintText = (ctx, text, x, y) => ctx.strokeText(text, x, y)

function strokeFrame(ctx: CanvasRenderingContext2D, frame: Frame) {
  const { width, height } = frame
  const radius = Math.min(frame.line * 1.2, width / 2, height / 2)
  ctx.beginPath()
  if (typeof ctx.roundRect === 'function')
    ctx.roundRect(-width / 2, -height / 2, width, height, radius)
  else ctx.rect(-width / 2, -height / 2, width, height)
  ctx.stroke()
}

/** Paints one text block centered at the origin of the current transform. */
function paintLines(
  ctx: CanvasRenderingContext2D,
  config: WatermarkConfig,
  m: Metrics,
  paint: PaintText,
) {
  const blockW = m.block.width
  const top = -((m.lines.length - 1) * m.lineHeightPx) / 2
  m.lines.forEach((line, i) => {
    if (!line.text) return
    const y = top + i * m.lineHeightPx
    let x =
      config.textAlign === 'left'
        ? -blockW / 2
        : config.textAlign === 'right'
          ? blockW / 2 - line.width
          : -line.width / 2
    if (!line.glyphs) {
      paint(ctx, line.text, x, y)
      return
    }
    for (const glyph of line.glyphs) {
      paint(ctx, glyph.text, x, y)
      x += glyph.advance
    }
  })
}

let logoCache: {
  source: CanvasImageSource
  width: number
  height: number
  scaled: HTMLCanvasElement
} | null = null

/**
 * A logo much larger than it is drawn is scaled down once, instead of resampling the full
 * image for every tile.
 */
function scaledLogo(logo: LogoAsset, width: number, height: number): CanvasImageSource {
  if (logo.width <= width * 1.5 && logo.height <= height * 1.5) return logo.source
  const w = Math.max(1, Math.ceil(width))
  const h = Math.max(1, Math.ceil(height))
  if (logoCache?.source === logo.source && logoCache.width === w && logoCache.height === h) {
    return logoCache.scaled
  }
  const scaled = document.createElement('canvas')
  scaled.width = w
  scaled.height = h
  const ctx = scaled.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(logo.source, 0, 0, w, h)
  logoCache = { source: logo.source, width: w, height: h, scaled }
  return scaled
}

/** Paints opaque watermarks centered at `centers` (image coordinates) onto the layer. */
function paintBlocks(
  ctx: CanvasRenderingContext2D,
  origin: Point,
  centers: Point[],
  angle: number,
  config: WatermarkConfig,
  content: WatermarkContent,
  m: Metrics,
) {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const forEachBlock = (draw: () => void) => {
    for (const c of centers) {
      ctx.setTransform(cos, sin, -sin, cos, origin.x + c.x, origin.y + c.y)
      draw()
    }
  }

  if (config.kind === 'image') {
    const { width, height } = m.block
    const logo = scaledLogo(content.logo!, width, height)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    forEachBlock(() => ctx.drawImage(logo, -width / 2, -height / 2, width, height))
    return
  }

  ctx.font = cssFont(config, m.fontPx)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  if (nativeLetterSpacing) ctx.letterSpacing = `${m.spacingPx}px`
  ctx.lineJoin = 'round'
  ctx.miterLimit = 2
  const frame = m.frame
  if (config.strokeEnabled) {
    // Outlines of all blocks first, so a neighbour's outline never covers a fill.
    const outline = (config.strokeWidth / 100) * m.fontPx
    ctx.strokeStyle = config.strokeColor
    ctx.lineWidth = 2 * outline
    forEachBlock(() => paintLines(ctx, config, m, strokeText))
    if (frame) {
      ctx.lineWidth = frame.line + 2 * outline
      forEachBlock(() => strokeFrame(ctx, frame))
    }
  }
  ctx.fillStyle = config.color
  forEachBlock(() => paintLines(ctx, config, m, fillText))
  if (frame) {
    ctx.strokeStyle = config.color
    ctx.lineWidth = frame.line
    forEachBlock(() => strokeFrame(ctx, frame))
  }
}

let sharedLayer: HTMLCanvasElement | null = null

function layerCanvas(width: number, height: number): HTMLCanvasElement {
  sharedLayer ??= document.createElement('canvas')
  if (sharedLayer.width !== width || sharedLayer.height !== height) {
    sharedLayer.width = width
    sharedLayer.height = height
  }
  return sharedLayer
}

/** Large layers (exports) are freed right away; small ones (preview) are kept for reuse. */
function releaseLayer() {
  if (sharedLayer && sharedLayer.width * sharedLayer.height > 4_000_000) {
    sharedLayer.width = 0
    sharedLayer.height = 0
  }
}

/** Size of the watermark block (unrotated) on an image of the given size, or null if empty. */
export function watermarkBlockSize(
  config: WatermarkConfig,
  content: WatermarkContent,
  size: Size,
): Size | null {
  return measure(config, content, size)?.block ?? null
}

/**
 * Composites the watermark onto `target`, whose canvas is `size` pixels large and already
 * holds the image (or is transparent, to produce a watermark-only overlay).
 */
export function drawWatermark(
  target: CanvasRenderingContext2D,
  size: Size,
  config: WatermarkConfig,
  content: WatermarkContent,
): void {
  const width = Math.round(size.width)
  const height = Math.round(size.height)
  if (width < 1 || height < 1) return

  const m = measure(config, content, { width, height })
  if (!m) return

  const angle = (-config.rotation * Math.PI) / 180
  const shadow = config.shadowEnabled
    ? {
        blur: (config.shadowBlur / 100) * m.unit,
        offset: (config.shadowOffset / 100) * m.unit,
      }
    : null
  // Watermarks just outside a band (or the image) can still cast a shadow into it.
  const pad = Math.ceil(shadow ? shadow.blur * 1.5 + shadow.offset + 2 : 2)
  // Canvases are limited to 32767 pixels per side; very wide images get less side padding.
  const padX = Math.max(0, Math.min(pad, Math.floor((MAX_CANVAS_SIDE - width) / 2)))
  const layerW = width + 2 * padX
  const bandH = Math.min(
    height,
    MAX_CANVAS_SIDE - 2 * pad,
    Math.max(64, Math.floor(MAX_LAYER_PIXELS / layerW) - 2 * pad),
  )

  const single =
    config.layout === 'single'
      ? [
          singleCenter({
            canvas: { width, height },
            block: m.block,
            angle,
            anchor: config.anchor,
            margin: (config.margin / 100) * Math.min(width, height),
            position: { x: config.posX, y: config.posY },
          }),
        ]
      : null

  const layer = layerCanvas(layerW, bandH + 2 * pad)
  const ctx = layer.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D is not available')

  try {
    for (let y0 = 0; y0 < height; y0 += bandH) {
      const bandHeight = Math.min(bandH, height - y0)
      const region: Rect = { x: -padX, y: y0 - pad, width: layerW, height: bandHeight + 2 * pad }
      const centers =
        single ??
        tileCenters({
          canvas: { width, height },
          block: m.block,
          gapX: config.gapX * m.unit,
          gapY: config.gapY * m.unit,
          angle,
          stagger: config.stagger,
          region,
        })

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, layer.width, layer.height)
      paintBlocks(ctx, { x: padX, y: pad - y0 }, centers, angle, config, content, m)

      target.save()
      target.setTransform(1, 0, 0, 1, 0, 0)
      target.beginPath()
      target.rect(0, y0, width, bandHeight)
      target.clip()
      target.globalAlpha = config.opacity / 100
      if (shadow) {
        target.shadowColor = config.shadowColor
        target.shadowBlur = shadow.blur
        target.shadowOffsetX = shadow.offset
        target.shadowOffsetY = shadow.offset
      }
      target.drawImage(layer, -padX, y0 - pad)
      target.restore()
    }
  } finally {
    releaseLayer()
  }
}
