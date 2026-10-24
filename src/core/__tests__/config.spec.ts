import { describe, expect, it } from 'vitest'

import {
  DEFAULT_CONFIG,
  DEFAULT_EXPORT,
  LIMITS,
  normalizeConfig,
  normalizeExportOptions,
} from '../config'

describe('normalizeConfig', () => {
  it('returns the defaults for missing input', () => {
    expect(normalizeConfig(undefined)).toEqual(DEFAULT_CONFIG)
    expect(normalizeConfig(null)).toEqual(DEFAULT_CONFIG)
    expect(normalizeConfig('nonsense')).toEqual(DEFAULT_CONFIG)
  })

  it('keeps valid values', () => {
    const config = normalizeConfig({
      ...DEFAULT_CONFIG,
      text: 'Hello',
      rotation: -45,
      color: '#FF0000',
    })
    expect(config.text).toBe('Hello')
    expect(config.rotation).toBe(-45)
    expect(config.color).toBe('#ff0000')
  })

  it('clamps numbers to their limits', () => {
    const config = normalizeConfig({ fontSize: 1000, opacity: -5, gapX: 999, rotation: 720 })
    expect(config.fontSize).toBe(LIMITS.fontSize.max)
    expect(config.opacity).toBe(LIMITS.opacity.min)
    expect(config.gapX).toBe(LIMITS.gapX.max)
    expect(config.rotation).toBe(LIMITS.rotation.max)
  })

  it('rejects values of the wrong type or shape', () => {
    const config = normalizeConfig({
      kind: 'video',
      fontSize: '12',
      italic: 'yes',
      color: 'red',
      layout: 42,
      anchor: 'somewhere',
      opacity: Number.NaN,
    })
    expect(config.kind).toBe(DEFAULT_CONFIG.kind)
    expect(config.fontSize).toBe(DEFAULT_CONFIG.fontSize)
    expect(config.italic).toBe(DEFAULT_CONFIG.italic)
    expect(config.color).toBe(DEFAULT_CONFIG.color)
    expect(config.layout).toBe(DEFAULT_CONFIG.layout)
    expect(config.anchor).toBe(DEFAULT_CONFIG.anchor)
    expect(config.opacity).toBe(DEFAULT_CONFIG.opacity)
  })

  it('rounds font weights to hundreds and falls back for blank font names', () => {
    expect(normalizeConfig({ fontWeight: 650 }).fontWeight).toBe(700)
    expect(normalizeConfig({ fontFamily: '   ' }).fontFamily).toBe(DEFAULT_CONFIG.fontFamily)
  })

  it('limits the text length', () => {
    expect(normalizeConfig({ text: 'x'.repeat(5000) }).text).toHaveLength(2000)
  })
})

describe('normalizeExportOptions', () => {
  it('returns the defaults for missing input', () => {
    expect(normalizeExportOptions(undefined)).toEqual(DEFAULT_EXPORT)
  })

  it('snaps the resolution to an offered value', () => {
    expect(normalizeExportOptions({ pdfDpi: 160 }).pdfDpi).toBe(150)
    expect(normalizeExportOptions({ pdfDpi: 5000 }).pdfDpi).toBe(300)
  })

  it('validates enums and quality', () => {
    const options = normalizeExportOptions({ imageFormat: 'gif', pdfMode: 'magic', quality: 10 })
    expect(options.imageFormat).toBe(DEFAULT_EXPORT.imageFormat)
    expect(options.pdfMode).toBe(DEFAULT_EXPORT.pdfMode)
    expect(options.quality).toBe(LIMITS.quality.min)
  })
})
