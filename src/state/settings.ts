import { reactive, shallowRef, watch } from 'vue'

import {
  DEFAULT_CONFIG,
  DEFAULT_EXPORT,
  normalizeConfig,
  normalizeExportOptions,
  type ExportOptions,
  type WatermarkConfig,
} from '@/core/config'
import { isCustomFontFamily } from '@/core/fonts'
import { t } from '@/i18n'
import { fonts } from './fonts'
import { readStored, removeStored, writeStored } from './storage'

/** Settings are remembered in this browser only (localStorage); they never leave it. */
function initialConfig(): WatermarkConfig {
  const saved = readStored('config')
  const config = normalizeConfig(saved)
  if (!saved) config.text = t('defaults.text')
  // Fonts loaded from a file are gone after a reload.
  if (isCustomFontFamily(config.fontFamily)) config.fontFamily = DEFAULT_CONFIG.fontFamily
  return config
}

export const config = reactive<WatermarkConfig>(initialConfig())
export const exportOptions = reactive<ExportOptions>(normalizeExportOptions(readStored('export')))

let saveTimer: ReturnType<typeof setTimeout> | undefined
watch(
  [config, exportOptions],
  () => {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      writeStored('config', config)
      writeStored('export', exportOptions)
    }, 300)
  },
  { deep: true },
)

/** Restores the default look, keeping the text and the export options. */
export function resetStyle(): void {
  Object.assign(config, { ...DEFAULT_CONFIG, kind: config.kind, text: config.text })
}

export function resetExportOptions(): void {
  Object.assign(exportOptions, DEFAULT_EXPORT)
}

export type StylePreset = 'classic' | 'dense' | 'center' | 'corner' | 'stamp'

export const STYLE_PRESETS: Record<StylePreset, Partial<WatermarkConfig>> = {
  classic: {
    layout: 'tile',
    fontSize: 4,
    rotation: 30,
    gapX: 3,
    gapY: 3,
    stagger: true,
    opacity: 30,
    color: '#7f7f7f',
    letterSpacing: 0,
    fontWeight: 400,
    strokeEnabled: false,
    frameEnabled: false,
    shadowEnabled: false,
  },
  dense: {
    layout: 'tile',
    fontSize: 2.4,
    rotation: 25,
    gapX: 1.6,
    gapY: 2.2,
    stagger: true,
    opacity: 22,
    color: '#5f6b7a',
    letterSpacing: 0,
    fontWeight: 400,
    strokeEnabled: false,
    frameEnabled: false,
    shadowEnabled: false,
  },
  center: {
    layout: 'single',
    anchor: 'center',
    fontSize: 11,
    rotation: 30,
    opacity: 22,
    color: '#7f7f7f',
    letterSpacing: 0,
    fontWeight: 700,
    strokeEnabled: false,
    frameEnabled: false,
    shadowEnabled: false,
  },
  corner: {
    layout: 'single',
    anchor: 'bottom-right',
    margin: 3,
    fontSize: 3.2,
    rotation: 0,
    opacity: 85,
    color: '#ffffff',
    letterSpacing: 0,
    fontWeight: 600,
    strokeEnabled: false,
    frameEnabled: false,
    shadowEnabled: true,
    shadowColor: '#000000',
    shadowBlur: 18,
    shadowOffset: 4,
  },
  stamp: {
    layout: 'single',
    anchor: 'center',
    fontSize: 9,
    rotation: 18,
    opacity: 55,
    color: '#d0312d',
    fontWeight: 800,
    letterSpacing: 0.12,
    strokeEnabled: false,
    frameEnabled: true,
    frameWidth: 9,
    framePadding: 0.45,
    shadowEnabled: false,
  },
}

export function applyStylePreset(preset: StylePreset): void {
  Object.assign(config, STYLE_PRESETS[preset])
}

/** A complete configuration (including the text) saved under a name by the user. */
export interface SavedStyle {
  id: string
  name: string
  config: WatermarkConfig
}

export const MAX_SAVED_STYLES = 20

function loadSavedStyles(): SavedStyle[] {
  const saved = readStored('styles')
  if (!Array.isArray(saved)) return []
  return saved
    .filter((style): style is { id: string; name: string; config: unknown } => {
      const s = style as Partial<SavedStyle> | null
      return typeof s?.id === 'string' && typeof s.name === 'string'
    })
    .slice(0, MAX_SAVED_STYLES)
    .map((style) => ({ id: style.id, name: style.name, config: normalizeConfig(style.config) }))
}

export const savedStyles = reactive<SavedStyle[]>(loadSavedStyles())

watch(savedStyles, () => writeStored('styles', savedStyles), { deep: true })

export function saveStyle(name: string): SavedStyle | null {
  if (savedStyles.length >= MAX_SAVED_STYLES) return null
  const style: SavedStyle = {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim().slice(0, 40),
    config: { ...config },
  }
  savedStyles.push(style)
  return style
}

export function applySavedStyle(id: string): void {
  const style = savedStyles.find((s) => s.id === id)
  if (!style) return
  const next = normalizeConfig(style.config)
  // A font loaded from a file during an earlier visit is no longer available.
  const loaded = fonts.custom.some((font) => font.family === next.fontFamily)
  if (isCustomFontFamily(next.fontFamily) && !loaded) next.fontFamily = DEFAULT_CONFIG.fontFamily
  Object.assign(config, next)
}

export function deleteSavedStyle(id: string): void {
  const index = savedStyles.findIndex((s) => s.id === id)
  if (index >= 0) savedStyles.splice(index, 1)
}

export interface Logo {
  name: string
  image: HTMLImageElement
  width: number
  height: number
}

export const logo = shallowRef<Logo | null>(null)

/** Logos up to this size (as a data URL) are remembered between visits. */
const MAX_STORED_LOGO = 1_500_000

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

async function imageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  const image = new Image()
  image.src = dataUrl
  await image.decode()
  return image
}

export async function setLogoFile(file: File): Promise<void> {
  const dataUrl = await readAsDataUrl(file)
  const image = await imageFromDataUrl(dataUrl)
  const width = image.naturalWidth || 512
  const height = image.naturalHeight || 512
  logo.value = { name: file.name, image, width, height }
  if (dataUrl.length > MAX_STORED_LOGO || !writeStored('logo', { name: file.name, dataUrl })) {
    removeStored('logo')
  }
}

export function clearLogo(): void {
  logo.value = null
  removeStored('logo')
}

export async function restoreLogo(): Promise<void> {
  const saved = readStored('logo') as { name?: unknown; dataUrl?: unknown } | null
  if (!saved || typeof saved.dataUrl !== 'string' || !saved.dataUrl.startsWith('data:image/')) {
    return
  }
  try {
    const image = await imageFromDataUrl(saved.dataUrl)
    logo.value = {
      name: typeof saved.name === 'string' ? saved.name : 'logo',
      image,
      width: image.naturalWidth || 512,
      height: image.naturalHeight || 512,
    }
  } catch {
    removeStored('logo')
  }
}
