import { describe, expect, it } from 'vitest'

import { dependsOnPage, resolveTemplate } from '../template'

const ctx = {
  fileName: 'ID card.front.jpg',
  page: 3,
  pages: 12,
  now: new Date(2026, 0, 5, 9, 7),
}

describe('resolveTemplate', () => {
  it('replaces every variable', () => {
    expect(resolveTemplate('{date} {time} | {datetime}', ctx)).toBe(
      '2026-01-05 09:07 | 2026-01-05 09:07',
    )
    expect(resolveTemplate('{filename} – {page}/{pages}', ctx)).toBe('ID card.front – 3/12')
  })

  it('is case-insensitive and leaves unknown placeholders alone', () => {
    expect(resolveTemplate('{DATE} {unknown} {page', ctx)).toBe('2026-01-05 {unknown} {page')
  })

  it('handles names without an extension', () => {
    expect(resolveTemplate('{filename}', { ...ctx, fileName: 'README' })).toBe('README')
    expect(resolveTemplate('{filename}', { ...ctx, fileName: '.hidden' })).toBe('.hidden')
  })
})

describe('dependsOnPage', () => {
  it('detects per-page text', () => {
    expect(dependsOnPage('Page {page}')).toBe(true)
    expect(dependsOnPage('{PAGE}')).toBe(true)
    expect(dependsOnPage('{pages} pages')).toBe(false)
    expect(dependsOnPage('plain')).toBe(false)
  })
})
