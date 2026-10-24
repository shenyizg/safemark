import { strFromU8, unzipSync } from 'fflate'
import { describe, expect, it } from 'vitest'

import { createZip } from '../zip'

describe('createZip', () => {
  it('stores files with UTF-8 names', async () => {
    const zip = await createZip([
      { name: '身份证_watermarked.jpg', data: new Blob(['jpeg bytes']) },
      { name: 'report.pdf', data: new Blob([new Uint8Array([37, 80, 68, 70])]) },
    ])
    expect(zip.type).toBe('application/zip')
    const entries = unzipSync(new Uint8Array(await zip.arrayBuffer()))
    expect(Object.keys(entries)).toEqual(['身份证_watermarked.jpg', 'report.pdf'])
    expect(strFromU8(entries['身份证_watermarked.jpg']!)).toBe('jpeg bytes')
    expect(Array.from(entries['report.pdf']!)).toEqual([37, 80, 68, 70])
  })

  it('creates an empty archive', async () => {
    const zip = await createZip([])
    expect(Object.keys(unzipSync(new Uint8Array(await zip.arrayBuffer())))).toEqual([])
  })
})
