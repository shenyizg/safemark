import { describe, expect, it } from 'vitest'

import {
  dedupeFileNames,
  detectKind,
  formatBytes,
  outputFileName,
  sanitizeFileName,
  splitExtension,
} from '../files'

describe('detectKind', () => {
  it('uses the MIME type', () => {
    expect(detectKind({ name: 'a', type: 'application/pdf' })).toBe('pdf')
    expect(detectKind({ name: 'a', type: 'image/webp' })).toBe('image')
    expect(detectKind({ name: 'a.txt', type: 'text/plain' })).toBeNull()
  })

  it('falls back to the extension when the type is missing', () => {
    expect(detectKind({ name: 'Scan.PDF', type: '' })).toBe('pdf')
    expect(detectKind({ name: 'IMG_0001.HEIC', type: '' })).toBe('image')
    expect(detectKind({ name: 'photo.jpeg', type: '' })).toBe('image')
    expect(detectKind({ name: 'archive.zip', type: '' })).toBeNull()
  })
})

describe('file names', () => {
  it('splits extensions', () => {
    expect(splitExtension('a.b.c')).toEqual({ base: 'a.b', ext: 'c' })
    expect(splitExtension('noext')).toEqual({ base: 'noext', ext: '' })
    expect(splitExtension('.bashrc')).toEqual({ base: '.bashrc', ext: '' })
    expect(splitExtension('trailing.')).toEqual({ base: 'trailing.', ext: '' })
  })

  it('builds output names', () => {
    expect(outputFileName('身份证正面.jpeg', '_watermarked', 'jpg')).toBe(
      '身份证正面_watermarked.jpg',
    )
    expect(outputFileName('scan', '-wm', 'pdf')).toBe('scan-wm.pdf')
  })

  it('removes characters that are invalid in file names', () => {
    expect(sanitizeFileName('a<b>c:d"e/f\\g|h?i*j')).toBe('a_b_c_d_e_f_g_h_i_j')
    expect(sanitizeFileName('name. ')).toBe('name')
    expect(sanitizeFileName('')).toBe('file')
  })

  it('makes names unique', () => {
    expect(dedupeFileNames(['a.png', 'A.png', 'a.png', 'b', 'b'])).toEqual([
      'a.png',
      'A (2).png',
      'a (3).png',
      'b',
      'b (2)',
    ])
  })
})

describe('formatBytes', () => {
  it('formats sizes', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(25 * 1024 * 1024)).toBe('25 MB')
  })
})
