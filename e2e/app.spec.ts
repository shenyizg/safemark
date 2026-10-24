import fs from 'node:fs/promises'
import path from 'node:path'

import { test as base, expect, type Download, type FileChooser, type Page } from '@playwright/test'
import { unzipSync } from 'fflate'
import { PDFDict, PDFDocument, PDFName } from 'pdf-lib'

const fixture = (name: string) => path.join(import.meta.dirname, 'fixtures', name)

/**
 * Fails any test that logs an error or makes a request to another origin — the latter is
 * the app's privacy promise.
 */
const test = base.extend<{ guard: void }>({
  guard: [
    async ({ page, baseURL }, use) => {
      const problems: string[] = []
      page.on('pageerror', (error) => problems.push(error.message))
      page.on('console', (message) => {
        if (message.type() === 'error') problems.push(message.text())
      })
      page.on('request', (request) => {
        const url = request.url()
        if (!url.startsWith(baseURL!) && !/^(blob|data):/.test(url)) {
          problems.push(`request to ${url}`)
        }
      })
      await use()
      expect(problems).toEqual([])
    },
    { auto: true },
  ],
})

async function addFiles(page: Page, files: Parameters<FileChooser['setFiles']>[0]) {
  const chooser = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Choose files', exact: true }).click()
  await (await chooser).setFiles(files)
}

async function loadSamples(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Try with samples' }).click()
  await expect(page.getByRole('button', { name: 'Export all (2)' })).toBeEnabled()
}

async function readDownload(download: Download): Promise<Uint8Array> {
  return new Uint8Array(await fs.readFile((await download.path())!))
}

/** Width and height from a JPEG's start-of-frame marker. */
function jpegSize(bytes: Uint8Array): { width: number; height: number } {
  let i = 2
  while (i < bytes.length) {
    const marker = bytes[i + 1]!
    const length = (bytes[i + 2]! << 8) | bytes[i + 3]!
    if (marker >= 0xc0 && marker <= 0xc2) {
      return {
        height: (bytes[i + 5]! << 8) | bytes[i + 6]!,
        width: (bytes[i + 7]! << 8) | bytes[i + 8]!,
      }
    }
    i += 2 + length
  }
  throw new Error('No SOF marker')
}

function pageResources(doc: PDFDocument, index: number) {
  const resources = doc.getPage(index).node.Resources()!
  const names = (key: string) => {
    const dict = resources.lookupMaybe(PDFName.of(key), PDFDict)
    return dict ? dict.keys().map((name) => name.asString()) : []
  }
  return { fonts: names('Font'), xObjects: names('XObject') }
}

/** Share of reddish pixels in the preview canvas. */
function redShare(page: Page) {
  return page.locator('canvas.canvas').evaluate((canvas: HTMLCanvasElement) => {
    const { data } = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height)
    let red = 0
    for (let i = 0; i < data.length; i += 4) {
      if (data[i]! > 170 && data[i + 1]! < 90 && data[i + 2]! < 90) red++
    }
    return red / (data.length / 4)
  })
}

test('shows the privacy promise and the empty state', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/SafeMark/)
  await expect(page.getByRole('button', { name: /Runs locally/ })).toBeVisible()
  await expect(page.getByText('Drop images or PDFs here')).toBeVisible()
})

test('draws the watermark into the preview and compares with the original', async ({ page }) => {
  await loadSamples(page)
  await page.getByLabel('Watermark text (multi-line)').fill('SAFEMARK TEST')
  const color = page.getByRole('textbox', { name: 'Color', exact: true })
  await color.fill('#ff0000')
  await color.press('Enter')
  await page.getByRole('spinbutton', { name: 'Opacity' }).fill('100')
  await page.getByRole('spinbutton', { name: 'Opacity' }).press('Enter')

  await expect.poll(() => redShare(page)).toBeGreaterThan(0.01)

  const compare = page.getByRole('button', { name: 'Hold to compare' })
  await compare.hover()
  await page.mouse.down()
  await expect.poll(() => redShare(page)).toBeLessThan(0.001)
  await page.mouse.up()
  await expect.poll(() => redShare(page)).toBeGreaterThan(0.01)
})

test('exports all files as a ZIP archive', async ({ page }) => {
  await loadSamples(page)
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export all (2)' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^safemark-\d{8}-\d{4}\.zip$/)

  const entries = unzipSync(await readDownload(download))
  expect(Object.keys(entries).sort()).toEqual([
    'sample-document_watermarked.pdf',
    'sample-photo_watermarked.jpg',
  ])
  expect(jpegSize(entries['sample-photo_watermarked.jpg']!)).toEqual({ width: 1600, height: 1067 })

  // Overlay mode keeps the original text and adds an image on top.
  const pdf = await PDFDocument.load(entries['sample-document_watermarked.pdf']!)
  expect(pdf.getPageCount()).toBe(2)
  const first = pageResources(pdf, 0)
  expect(first.fonts.length).toBeGreaterThan(0)
  expect(first.xObjects.length).toBeGreaterThan(0)
  await expect(page.getByText('2 file(s) done')).toBeVisible()
})

test('flattens PDFs into images', async ({ page }) => {
  await loadSamples(page)
  await page.getByRole('button', { name: 'Export settings' }).click()
  await page.getByRole('radio', { name: 'Flatten' }).click()
  await page.locator('.file').nth(1).click()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export this' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('sample-document_watermarked.pdf')

  const pdf = await PDFDocument.load(await readDownload(download))
  expect(pdf.getPageCount()).toBe(2)
  for (let i = 0; i < 2; i++) {
    const { fonts, xObjects } = pageResources(pdf, i)
    expect(fonts).toEqual([])
    expect(xObjects).toHaveLength(1)
  }
  const [portrait, landscape] = pdf.getPages()
  expect(portrait!.getSize().width).toBeCloseTo(595.28, 1)
  expect(landscape!.getSize().width).toBeCloseTo(841.89, 1)
})

test('opens password-protected PDFs', async ({ page }) => {
  await page.goto('/')
  await addFiles(page, fixture('encrypted-user-password.pdf'))

  const dialog = page.getByRole('dialog', { name: 'Password required' })
  await expect(dialog).toBeVisible()
  await dialog.getByLabel('PDF password').fill('wrong')
  await dialog.getByRole('button', { name: 'Open' }).click()
  await expect(dialog.getByText('Wrong password')).toBeVisible()
  await dialog.getByLabel('PDF password').fill('safemark')
  await dialog.getByRole('button', { name: 'Open' }).click()
  await expect(dialog).toBeHidden()

  // Encrypted files cannot be edited in place, so the export falls back to flattening.
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  const pdf = await PDFDocument.load(await readDownload(await downloadPromise))
  expect(pdf.isEncrypted).toBe(false)
  expect(pdf.getPageCount()).toBe(1)
  await expect(page.getByText('Encrypted PDFs cannot be edited in place')).toBeVisible()
})

test('a cancelled password prompt marks the file as failed', async ({ page }) => {
  await page.goto('/')
  await addFiles(page, fixture('encrypted-user-password.pdf'))
  const dialog = page.getByRole('dialog', { name: 'Password required' })
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByText('This PDF needs a password')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Export', exact: true })).toBeDisabled()
})

test('watermarks PDFs that only have an owner password', async ({ page }) => {
  await page.goto('/')
  await addFiles(page, fixture('encrypted-owner-only.pdf'))
  await expect(page.getByRole('button', { name: 'Export', exact: true })).toBeEnabled()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  const pdf = await PDFDocument.load(await readDownload(await downloadPromise))
  expect(pdf.getPageCount()).toBe(1)
})

test('uses an image as the watermark', async ({ page }) => {
  await loadSamples(page)
  await page.getByRole('radio', { name: 'Image / logo' }).click()
  const chooser = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Choose a logo image' }).click()
  await (await chooser).setFiles(path.join(import.meta.dirname, '..', 'public', 'favicon.svg'))
  await expect(page.getByText('favicon.svg')).toBeVisible()
  await expect(page.getByRole('slider', { name: 'Logo width' })).toBeVisible()
})

test('positions a single watermark by dragging', async ({ page }) => {
  await loadSamples(page)
  await page.getByRole('radio', { name: 'Single' }).click()
  const canvas = page.locator('canvas.canvas')
  const box = (await canvas.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.3, { steps: 5 })
  await page.mouse.up()
  await expect(page.getByText('Custom position (drag in the preview)')).toBeVisible()
})

test('remembers settings and switches language', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Watermark text (multi-line)').fill('Remember me')
  // Settings are saved shortly after the last change.
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('safemark:config')))
    .toContain('Remember me')
  await page.reload()
  await expect(page.getByLabel('Watermark text (multi-line)')).toHaveValue('Remember me')

  await page.getByRole('button', { name: '切换到中文' }).click()
  await expect(page.getByRole('heading', { name: '水印设置' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')
})

test('saves and applies named styles', async ({ page }) => {
  await page.goto('/')
  const text = page.getByLabel('Watermark text (multi-line)')
  await text.fill('For bank account opening only')
  await page.getByRole('button', { name: 'Save current style' }).click()
  await page.getByRole('textbox', { name: /Style name/ }).fill('Bank')
  await page.keyboard.press('Enter')

  await page.getByRole('button', { name: 'Red stamp' }).click()
  await text.fill('APPROVED')
  await page.getByRole('button', { name: 'Bank', exact: true }).click()
  await expect(text).toHaveValue('For bank account opening only')

  await page.reload()
  await expect(page.getByRole('button', { name: 'Bank', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Delete “Bank”' }).click()
  await expect(page.getByRole('button', { name: 'Bank', exact: true })).toHaveCount(0)
})

test('keeps working offline after the first visit', async ({ page, context, browserName }) => {
  // eslint-disable-next-line playwright/no-skipped-test -- not a disabled test, a browser limitation
  test.skip(browserName !== 'chromium', 'Service worker control is only automated in Chromium')
  await page.goto('/')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)

  await context.setOffline(true)
  await page.reload()
  await page.getByRole('button', { name: 'Try with samples' }).click()
  await expect(page.getByRole('button', { name: 'Export all (2)' })).toBeEnabled()
  await context.setOffline(false)
})
