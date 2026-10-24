<p align="center">
  <img src="public/favicon.svg" width="84" height="84" alt="SafeMark logo" />
</p>

<h1 align="center">SafeMark</h1>

<p align="center">
  Add watermarks to images and PDFs <b>entirely in your browser</b> — your files never leave your device.
</p>

<p align="center">
  <a href="https://shenyizg.github.io/safemark/"><b>🚀 Open the app</b></a> ·
  <a href="README.zh-CN.md">简体中文</a> ·
  <a href="#-development">Development</a> ·
  <a href="#-host-your-own-copy">Self-hosting</a>
</p>

<p align="center">
  <a href="https://github.com/shenyizg/safemark/actions/workflows/ci.yml"><img src="https://github.com/shenyizg/safemark/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://github.com/shenyizg/safemark/actions/workflows/deploy.yml"><img src="https://github.com/shenyizg/safemark/actions/workflows/deploy.yml/badge.svg" alt="Deploy" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-097479" alt="MIT License" /></a>
</p>

<p align="center">
  <img src="docs/screenshots/desktop-en-dark.png" alt="SafeMark screenshot" width="900" />
</p>

## Why

Stamping “for XX use only” on copies of ID cards, business licenses, contracts or quotes is a common way to keep them from being misused. Yet most online watermark tools first **upload** those very documents to a server — one more chance for sensitive files to leak.

SafeMark (安心水印, “peace-of-mind watermark”) does all the work inside your browser. **Your files never leave your device**: there is no server, no account and no analytics, and after the first visit it even works **offline**.

## ✨ Features

**Privacy first**

- 🔒 Everything is processed locally; nothing is uploaded, no sign-up
- 🛡️ A strict Content Security Policy (CSP) makes the browser block any request to another site
- 🧹 EXIF metadata (GPS location, camera model…) is stripped from exported images
- 📴 Works offline as a PWA, and can be installed on desktops and phones

**Images and PDFs**

- 🖼️ JPG, PNG, WebP, GIF, BMP, AVIF, SVG and more, exported at full resolution
- 📄 Two ways to handle PDFs:
  - **Keep text** — the watermark is overlaid on the original; text stays selectable and searchable, and the file barely grows
  - **Flatten** — every page becomes an image with the watermark burned in, so it cannot simply be deleted in a PDF editor
- 🔑 Password-protected PDFs, rotated pages, crop boxes and mixed page sizes are handled
- 📦 Batch processing: many images and multi-page PDFs at once, downloaded as a ZIP; drop whole folders or paste screenshots

**Lots of options**

- ✍️ Text: multiple lines, font, weight, italic, size, color, **opacity**, letter spacing, line height, alignment
- 🔤 Fonts: detects common installed fonts (Latin and CJK); Chrome/Edge can list *all* installed fonts; or load your own font file (.ttf/.otf/.woff2)
- 🧩 Layout:
  - **Tiled** across the whole image with adjustable **rotation**, horizontal/vertical gaps (**tile density**) and staggered rows
  - **Single** watermark at one of nine positions with a margin — or **drag** it anywhere in the preview
- ✨ Effects: outline, shadow, rubber-stamp frame, plus one-click styles such as *Diagonal*, *Dense*, *Signature* and *Red stamp*
- 🔖 My styles: save complete settings (including the text) under a name, e.g. “ID card” or “Photo signature”, and switch with one click
- 🏷️ Logo watermarks from any image (a transparent PNG works best)
- 🧮 Variables: `{date}` `{time}` `{filename}` `{page}` `{pages}`, e.g. `For XX use only · {date}`
- 📐 Sizes are relative to the shorter side, so one setting looks the same on a phone screenshot, a 50 MP photo and an A4 page

**Pleasant to use**

- 👀 Live preview, “hold to compare” with the original, page-by-page PDF preview
- 🌏 English / 简体中文, light and dark themes, works on phones
- ⌨️ Shortcuts: `Ctrl/⌘ + O` open, `Ctrl/⌘ + S` export, `←` `→` switch files
- 💾 Settings are remembered in your browser for next time

<p align="center">
  <img src="docs/screenshots/desktop-zh.png" alt="Light theme, Chinese interface" width="640" />
  <img src="docs/screenshots/mobile-zh.png" alt="On a phone" width="190" />
</p>

## 🔐 How privacy is guaranteed

| Measure | What it means |
| --- | --- |
| Static site | The app is plain static files on GitHub Pages; there is no backend that could receive files |
| Content Security Policy | Rules such as `connect-src 'self'` make the browser refuse to send requests anywhere else |
| Self-hosted assets | pdf.js fonts, CMaps and decoders ship with the app — nothing is loaded from a CDN |
| No tracking | No analytics, ads or third-party scripts; settings stay in your browser's `localStorage` |
| Offline | The service worker caches only the app's own files |

**Verify it yourself:** open your browser's developer tools on the *Network* tab — adding, previewing and exporting files makes no upload requests. Or go offline after the first visit: the app keeps working. The code is open source; audits are welcome.

## 🚀 Usage

1. Open **<https://shenyizg.github.io/safemark/>**
2. Drop in images or PDFs (or click to choose files, paste a screenshot, or try the built-in samples)
3. Adjust the text, style and layout on the right — the preview updates live
4. Click **Export**: a single file downloads directly, several files come as a ZIP archive

> [!TIP]
> Downloads may not work inside the WeChat browser — tap “…” in the top right corner and choose “Open in browser”.
> On phones, exported images can be saved to the photo library through the system share sheet.

## 💻 Development

Requires [Node.js](https://nodejs.org/) `^22.18` or `>=24.12`.

```bash
git clone https://github.com/shenyizg/safemark.git
cd safemark
npm install
npm run dev          # http://localhost:5173
```

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Type-check and build into `dist/` |
| `npm run preview` | Serve the production build |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright; run `npx playwright install` once) |
| `npm run lint` / `npm run format` | ESLint / Prettier |

<details>
<summary>Project structure</summary>

```text
src/
├── core/            UI-independent logic (unit-testable)
│   ├── render.ts    Draws watermarks — the preview and the export share this code
│   ├── layout.ts    Positions of tiled and single watermarks
│   ├── pdf.ts       PDF preview, overlay export (pdf-lib) and flatten export (pdf.js)
│   ├── image.ts     Image decoding and export
│   ├── fonts.ts     Installed-font detection and font files
│   └── ...
├── state/           App state: file list, settings, preview cache, export pipeline
├── components/      Vue components
├── i18n/            English and Chinese strings
└── styles/          Global styles and themes
scripts/             Build plugins (service worker) and the icon generator
e2e/                 Playwright end-to-end tests
```

</details>

## 🌐 Host your own copy

SafeMark is a static site and runs on any static host.

**GitHub Pages (recommended)**

1. Fork this repository.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Push to `main` (or run *Deploy to GitHub Pages* from the Actions tab). Your copy will be served at `https://<user>.github.io/<repo>/`.

Links are derived from `GITHUB_REPOSITORY` at build time, so no configuration is needed. For a custom domain, set the `SITE_URL` environment variable.

**Anywhere else:** run `npm run build` and upload `dist/` to Cloudflare Pages, Vercel, Netlify, nginx… Asset URLs are relative, so any sub-path works.

## 🛠️ How it works

- **Rendering** — the watermark is drawn opaque onto a separate layer and then composited with the chosen opacity, so outlines, shadows and overlapping tiles never stack up into darker spots. Very large images are processed in bands to bound memory use. The preview and the export use the same drawing code, so what you see is what you get.
- **Sizes** — font size, spacing and margins are relative to the image's shorter side, so a batch of images with different resolutions looks consistent.
- **PDF “keep text”** — [pdf-lib](https://github.com/Hopding/pdf-lib) places a transparent watermark layer on every page, honoring `/Rotate` and crop boxes. Pages of the same size share one image, so files barely grow.
- **PDF “flatten”** — [pdf.js](https://github.com/mozilla/pdf.js) renders each page at the chosen DPI; the watermarked images are assembled into a new PDF.
- **Stack** — Vue 3, TypeScript, Vite, [fflate](https://github.com/101arrowz/fflate) for ZIP files and [Lucide](https://lucide.dev/) icons.

## 🧭 Browser support

Use a current version of Chrome, Edge, Safari or Firefox (desktop or mobile). The build targets Chrome/Edge 100+, Safari/iOS 15.4+ and Firefox 100+.

## ❓ FAQ

<details>
<summary><b>Can the watermark be removed?</b></summary>

No visible watermark is impossible to remove, but you can make misuse much harder:

- Use the tiled layout with a higher density so the watermark covers the key information.
- For PDFs, choose **Flatten** so the watermark cannot be deleted in a PDF editor.
- State the purpose and date in the watermark (e.g. `For XX bank account opening only · {date}`), so even a cropped copy can be traced.

</details>

<details>
<summary><b>Why can't I open HEIC photos?</b></summary>

Whether a browser can decode HEIC depends on the system: Safari (macOS/iOS) usually can, Chrome and others cannot yet. Export the photo as JPG first, or on an iPhone choose *Settings → Camera → Formats → Most Compatible*.

</details>

<details>
<summary><b>Why is a flattened PDF larger than the original?</b></summary>

Every page is stored as an image. Lower the PDF resolution (e.g. 150 DPI) or the quality in the export settings to make it smaller — or use **Keep text** if the watermark does not need to resist deletion.

</details>

<details>
<summary><b>Are my settings or files stored anywhere?</b></summary>

Watermark settings (and small logos) are kept in your browser's `localStorage` for next time. Opened files are never stored: they are gone when you close the page. Clearing the site data in your browser removes the settings too.

</details>

## 🤝 Contributing

Issues and pull requests are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md). Please report security or privacy problems privately as described in [SECURITY.md](SECURITY.md).

## 📄 License

[MIT](LICENSE) © SafeMark contributors
