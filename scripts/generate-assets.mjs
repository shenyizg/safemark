// Renders the PNG icons and the social preview image from the SVG logo.
// Usage: node scripts/generate-assets.mjs   (needs `npx playwright install chromium` once)

import fs from 'node:fs'
import path from 'node:path'

import { chromium } from '@playwright/test'

const root = path.join(import.meta.dirname, '..')
const publicDir = path.join(root, 'public')
const logo = fs.readFileSync(path.join(publicDir, 'favicon.svg'), 'utf8')

/** The logo's stripes on a full-bleed background, for platforms that apply their own mask. */
function fullBleed(scale) {
  return logo
    .replace(
      '<rect width="32" height="32" rx="8" fill="url(#g)"/>',
      '<rect width="32" height="32" fill="url(#g)"/>',
    )
    .replace(
      '<clipPath id="c"><rect width="32" height="32" rx="8"/></clipPath>',
      '<clipPath id="c"><rect width="32" height="32"/></clipPath>',
    )
    .replace(
      'transform="rotate(-30 16 16)"',
      `transform="translate(16 16) scale(${scale}) translate(-16 -16) rotate(-30 16 16)"`,
    )
}

const icons = [
  { file: 'icons/icon-192.png', size: 192, svg: logo, transparent: true },
  { file: 'icons/icon-512.png', size: 512, svg: logo, transparent: true },
  // Maskable icons must keep their content within the central 80% "safe zone".
  { file: 'icons/icon-maskable-512.png', size: 512, svg: fullBleed(0.72), transparent: false },
  { file: 'icons/apple-touch-icon.png', size: 180, svg: fullBleed(0.86), transparent: false },
]

const ogImage = `
<div style="width:1200px;height:630px;display:flex;align-items:center;gap:56px;padding:0 96px;
  box-sizing:border-box;background:linear-gradient(135deg,#0d1f24 0%,#0b3f45 55%,#0a6c78 100%);
  font-family:-apple-system,'PingFang SC','Microsoft YaHei','Segoe UI',sans-serif;color:#fff">
  <div style="width:220px;height:220px;flex:none">${logo.replace('<svg ', '<svg width="220" height="220" ')}</div>
  <div>
    <div style="font-size:84px;font-weight:800;letter-spacing:-1px">SafeMark</div>
    <div style="font-size:44px;font-weight:600;margin-top:6px;color:#bfeeed">安心水印</div>
    <div style="font-size:30px;margin-top:28px;color:#d6e4e6;line-height:1.45">
      图片与 PDF 本地加水印 · 文件不上传<br/>Watermark images &amp; PDFs, privately
    </div>
  </div>
</div>`

const browser = await chromium.launch()
const page = await browser.newPage()

for (const icon of icons) {
  await page.setViewportSize({ width: icon.size, height: icon.size })
  const svg = icon.svg.replace('<svg ', `<svg width="${icon.size}" height="${icon.size}" `)
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`)
  await page.screenshot({
    path: path.join(publicDir, icon.file),
    omitBackground: icon.transparent,
    clip: { x: 0, y: 0, width: icon.size, height: icon.size },
  })
  console.log('wrote', icon.file)
}

await page.setViewportSize({ width: 1200, height: 630 })
await page.setContent(`<html><body style="margin:0">${ogImage}</body></html>`)
await page.screenshot({ path: path.join(publicDir, 'og-image.png') })
console.log('wrote og-image.png')

await browser.close()
