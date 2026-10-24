/**
 * The watermark settings model. Every length is relative (to the shorter side of the image or
 * page, or to the watermark itself), so one configuration looks the same on a phone screenshot,
 * a 50-megapixel photo and an A4 page — which is what makes batch processing predictable.
 */

export type WatermarkKind = 'text' | 'image'
export type LayoutMode = 'tile' | 'single'
export type TextAlign = 'left' | 'center' | 'right'
export type Anchor =
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'left'
  | 'center'
  | 'right'
  | 'bottom-left'
  | 'bottom'
  | 'bottom-right'
  /** Free position set by dragging the watermark in the preview (see `posX`/`posY`). */
  | 'custom'

export interface WatermarkConfig {
  kind: WatermarkKind

  /** Watermark text; may span several lines and contain `{variables}`. */
  text: string
  /** A CSS font family name, e.g. `Microsoft YaHei` or `sans-serif`. */
  fontFamily: string
  fontWeight: number
  italic: boolean
  /** Font size in percent of the shorter side of the image. */
  fontSize: number
  /** Extra space between characters, in em. */
  letterSpacing: number
  /** Distance between baselines, as a multiple of the font size. */
  lineHeight: number
  textAlign: TextAlign
  color: string

  /** Logo width in percent of the shorter side of the image. */
  imageSize: number

  /** 0–100. */
  opacity: number
  /** Degrees, counter-clockwise. */
  rotation: number

  layout: LayoutMode
  /** Horizontal space between tiles, in multiples of the font size (or logo height). */
  gapX: number
  /** Vertical space between tiles, in multiples of the font size (or logo height). */
  gapY: number
  /** Shift every other row by half a tile, like bricks. */
  stagger: boolean

  anchor: Anchor
  /** Distance from the edge for anchored single watermarks, in percent of the shorter side. */
  margin: number
  /** Center of a `custom` anchored watermark, as fractions of width and height. */
  posX: number
  posY: number

  strokeEnabled: boolean
  strokeColor: string
  /** Outline thickness, in percent of the font size. */
  strokeWidth: number

  /** A border around the text in the text color, like a rubber stamp. */
  frameEnabled: boolean
  /** Border thickness, in percent of the font size. */
  frameWidth: number
  /** Space between the text and the border, in em. */
  framePadding: number

  shadowEnabled: boolean
  shadowColor: string
  /** Blur radius, in percent of the font size (or logo height). */
  shadowBlur: number
  /** Diagonal offset, in percent of the font size (or logo height). */
  shadowOffset: number
}

export type ImageFormat = 'original' | 'png' | 'jpeg' | 'webp'
export type PdfMode = 'overlay' | 'flatten'

export interface ExportOptions {
  imageFormat: ImageFormat
  /** JPEG/WebP quality in percent; also used for the page images of flattened PDFs. */
  quality: number
  /**
   * `overlay` keeps the original PDF (text stays selectable) and adds the watermark on top;
   * `flatten` turns every page into an image so the watermark cannot simply be deleted.
   */
  pdfMode: PdfMode
  /** Resolution of flattened pages and of the watermark layer in overlay mode. */
  pdfDpi: number
  /** Appended to the original file name, before the extension. */
  suffix: string
}

export const DEFAULT_CONFIG: Readonly<WatermarkConfig> = Object.freeze({
  kind: 'text',
  text: '',
  fontFamily: 'sans-serif',
  fontWeight: 400,
  italic: false,
  fontSize: 4,
  letterSpacing: 0,
  lineHeight: 1.3,
  textAlign: 'center',
  color: '#7f7f7f',
  imageSize: 22,
  opacity: 30,
  rotation: 30,
  layout: 'tile',
  gapX: 3,
  gapY: 3,
  stagger: true,
  anchor: 'center',
  margin: 4,
  posX: 0.5,
  posY: 0.5,
  strokeEnabled: false,
  strokeColor: '#ffffff',
  strokeWidth: 6,
  frameEnabled: false,
  frameWidth: 8,
  framePadding: 0.4,
  shadowEnabled: false,
  shadowColor: '#000000',
  shadowBlur: 12,
  shadowOffset: 4,
})

export const PDF_DPI_OPTIONS = [72, 96, 150, 200, 300] as const

export const DEFAULT_EXPORT: Readonly<ExportOptions> = Object.freeze({
  imageFormat: 'original',
  quality: 92,
  pdfMode: 'overlay',
  pdfDpi: 150,
  suffix: '_watermarked',
})

/** Allowed ranges of numeric settings. Shared by the UI controls and by `normalizeConfig`. */
export const LIMITS = {
  fontSize: { min: 1, max: 30, step: 0.1 },
  letterSpacing: { min: -0.2, max: 2, step: 0.01 },
  lineHeight: { min: 0.8, max: 3, step: 0.05 },
  imageSize: { min: 2, max: 100, step: 1 },
  opacity: { min: 1, max: 100, step: 1 },
  rotation: { min: -180, max: 180, step: 1 },
  gapX: { min: 0, max: 20, step: 0.1 },
  gapY: { min: 0, max: 20, step: 0.1 },
  margin: { min: 0, max: 40, step: 0.5 },
  posX: { min: 0, max: 1, step: 0.001 },
  posY: { min: 0, max: 1, step: 0.001 },
  strokeWidth: { min: 1, max: 30, step: 1 },
  frameWidth: { min: 2, max: 40, step: 1 },
  framePadding: { min: 0, max: 3, step: 0.05 },
  shadowBlur: { min: 0, max: 100, step: 1 },
  shadowOffset: { min: 0, max: 50, step: 1 },
  fontWeight: { min: 100, max: 900, step: 100 },
  quality: { min: 50, max: 100, step: 1 },
  pdfDpi: { min: 72, max: 300, step: 1 },
} as const satisfies Record<string, { min: number; max: number; step: number }>

const ANCHORS: readonly Anchor[] = [
  'top-left',
  'top',
  'top-right',
  'left',
  'center',
  'right',
  'bottom-left',
  'bottom',
  'bottom-right',
  'custom',
]

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function pickNumber(value: unknown, fallback: number, limit?: { min: number; max: number }) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return limit ? clamp(value, limit.min, limit.max) : value
}

function pickEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

function pickBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function pickColor(value: unknown, fallback: string): string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : fallback
}

function pickString(value: unknown, fallback: string, maxLength = 2000): string {
  return typeof value === 'string' ? value.slice(0, maxLength) : fallback
}

function nearest(value: number, options: readonly number[]): number {
  return options.reduce((best, option) =>
    Math.abs(option - value) < Math.abs(best - value) ? option : best,
  )
}

type Loose<T> = { [K in keyof T]?: unknown }

/**
 * Builds a valid configuration from untrusted input (e.g. settings saved by an older version),
 * falling back to defaults for anything missing or malformed.
 */
export function normalizeConfig(input: unknown): WatermarkConfig {
  const raw = (input && typeof input === 'object' ? input : {}) as Loose<WatermarkConfig>
  const d = DEFAULT_CONFIG
  const L = LIMITS
  return {
    kind: pickEnum(raw.kind, ['text', 'image'], d.kind),
    text: pickString(raw.text, d.text),
    fontFamily: pickString(raw.fontFamily, d.fontFamily, 200).trim() || d.fontFamily,
    fontWeight: Math.round(pickNumber(raw.fontWeight, d.fontWeight, L.fontWeight) / 100) * 100,
    italic: pickBoolean(raw.italic, d.italic),
    fontSize: pickNumber(raw.fontSize, d.fontSize, L.fontSize),
    letterSpacing: pickNumber(raw.letterSpacing, d.letterSpacing, L.letterSpacing),
    lineHeight: pickNumber(raw.lineHeight, d.lineHeight, L.lineHeight),
    textAlign: pickEnum(raw.textAlign, ['left', 'center', 'right'], d.textAlign),
    color: pickColor(raw.color, d.color),
    imageSize: pickNumber(raw.imageSize, d.imageSize, L.imageSize),
    opacity: pickNumber(raw.opacity, d.opacity, L.opacity),
    rotation: pickNumber(raw.rotation, d.rotation, L.rotation),
    layout: pickEnum(raw.layout, ['tile', 'single'], d.layout),
    gapX: pickNumber(raw.gapX, d.gapX, L.gapX),
    gapY: pickNumber(raw.gapY, d.gapY, L.gapY),
    stagger: pickBoolean(raw.stagger, d.stagger),
    anchor: pickEnum(raw.anchor, ANCHORS, d.anchor),
    margin: pickNumber(raw.margin, d.margin, L.margin),
    posX: pickNumber(raw.posX, d.posX, L.posX),
    posY: pickNumber(raw.posY, d.posY, L.posY),
    strokeEnabled: pickBoolean(raw.strokeEnabled, d.strokeEnabled),
    strokeColor: pickColor(raw.strokeColor, d.strokeColor),
    strokeWidth: pickNumber(raw.strokeWidth, d.strokeWidth, L.strokeWidth),
    frameEnabled: pickBoolean(raw.frameEnabled, d.frameEnabled),
    frameWidth: pickNumber(raw.frameWidth, d.frameWidth, L.frameWidth),
    framePadding: pickNumber(raw.framePadding, d.framePadding, L.framePadding),
    shadowEnabled: pickBoolean(raw.shadowEnabled, d.shadowEnabled),
    shadowColor: pickColor(raw.shadowColor, d.shadowColor),
    shadowBlur: pickNumber(raw.shadowBlur, d.shadowBlur, L.shadowBlur),
    shadowOffset: pickNumber(raw.shadowOffset, d.shadowOffset, L.shadowOffset),
  }
}

export function normalizeExportOptions(input: unknown): ExportOptions {
  const raw = (input && typeof input === 'object' ? input : {}) as Loose<ExportOptions>
  const d = DEFAULT_EXPORT
  return {
    imageFormat: pickEnum(raw.imageFormat, ['original', 'png', 'jpeg', 'webp'], d.imageFormat),
    quality: pickNumber(raw.quality, d.quality, LIMITS.quality),
    pdfMode: pickEnum(raw.pdfMode, ['overlay', 'flatten'], d.pdfMode),
    pdfDpi: nearest(pickNumber(raw.pdfDpi, d.pdfDpi, LIMITS.pdfDpi), PDF_DPI_OPTIONS),
    suffix: pickString(raw.suffix, d.suffix, 100),
  }
}
