<p align="center">
  <img src="public/favicon.svg" width="84" height="84" alt="SafeMark logo" />
</p>

<h1 align="center">SafeMark</h1>

<p align="center">
  Add watermarks to images and PDFs <b>entirely in your browser</b> — your files never leave your device.
</p>

<p align="center">
  <a href="https://shenyizg.github.io/safemark/"><b>🚀 Open the app</b></a> ·
  <a href="README.md">简体中文</a> ·
  <a href="#-development">Development</a> ·
  <a href="#-host-your-own-copy">Self-hosting</a>
</p>

<p align="center">
  <a href="https://github.com/shenyizg/safemark/actions/workflows/ci.yml"><img src="https://github.com/shenyizg/safemark/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://github.com/shenyizg/safemark/actions/workflows/deploy.yml"><img src="https://github.com/shenyizg/safemark/actions/workflows/deploy.yml/badge.svg" alt="Deploy" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-0b8287" alt="MIT License" /></a>
</p>

<p align="center">
  <img src="docs/screenshots/desktop-en-dark.png" alt="SafeMark screenshot" width="900" />
</p>

## Why

Stamping “for XX use only” on copies of ID cards, contracts or invoices is a common way to keep them from being misused. Yet most online watermark tools first **upload** those very documents to a server.

SafeMark (安心水印, “peace-of-mind watermark”) does all the work inside your browser. There is no server, no account and no analytics — after the first visit it even works **offline**.

## ✨ Features

**Privacy first**

- 🔒 Everything is processed locally; nothing is uploaded, no sign-up
- 🛡️ A strict Content Security Policy makes the browser block any request to another site
- 🧹 EXIF metadata (GPS location, camera model…) is stripped from exported images
- 📴 Works offline as an installable PWA

**Images and PDFs**

- 🖼️ JPG, PNG, WebP, GIF, BMP, AVIF, SVG and more, exported at full resolution
- 📄 Two ways to handle PDFs:
  - **Keep text** — the watermark is overlaid on the original; text stays selectable and the file barely grows
  - **Flatten** — every page becomes an image with the watermark burned in, so it cannot simply be deleted
- 🔑 Password-protected PDFs, rotated pages, crop boxes and mixed page sizes are handled
- 📦 Batch processing with ZIP download; drop whole folders or paste screenshots

**Lots of options**

- ✍️ Text: multiple lines, font, weight, italic, size, color, **opacity**, letter spacing, line height, alignment
- 🔤 Fonts: detects common installed fonts; Chrome/Edge can list *all* installed fonts; or load your own font file (.ttf/.otf/.woff2)
- 🧩 Layout:
  - **Tiled** across the whole image with adjustable **rotation**, horizontal/vertical gaps (**density**) and staggered rows
  - **Single** watermark at one of nine positions with a margin — or **drag** it anywhere in the preview
- ✨ Effects: outline, shadow, rubber-stamp frame, plus one-click styles
- 🔖 My styles: save complete settings (including the text) under a name, e.g. “ID card” or “Photo signature”, and switch with one click
- 🏷️ Logo watermarks from any (transparent) image
- 🧮 Variables: `{date}` `{time}` `{filename}` `{page}` `{pages}`
- 📐 Sizes are relative to the shorter side, so one setting looks the same on a phone screenshot, a 50 MP photo and an A4 page

**Pleasant to use**

- 👀 Live preview, “hold to compare”, page-by-page PDF preview
- 🌏 English / 简体中文, light and dark themes, works on phones
- ⌨️ Shortcuts: `Ctrl/⌘ + O` open, `Ctrl/⌘ + S` export, `←` `→` switch files
- 💾 Settings are remembered in your browser

## 🔐 How privacy is guaranteed

| Measure | What it means |
| --- | --- |
| Static site | The app is plain static files on GitHub Pages; there is no backend that could receive files |
| Content Security Policy | Rules such as `connect-src 'self'` make the browser refuse to send requests anywhere else |
| Self-hosted assets | pdf.js fonts, CMaps and decoders ship with the app — nothing is loaded from a CDN |
| No tracking | No analytics, ads or third-party scripts; settings stay in your browser's `localStorage` |
| Offline | The service worker caches only the app's own files |

**Verify it yourself:** open your browser's developer tools on the *Network* tab — adding, previewing and exporting files makes no upload requests. Or go offline after the first visit: the app keeps working. The code is open source; audits are welcome.

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

The interesting parts live in `src/core/`: `render.ts` draws watermarks (the same code powers the preview and the export), `layout.ts` computes positions, and `pdf.ts` handles both PDF modes.

## 🌐 Host your own copy

SafeMark is a static site and runs on any static host.

**GitHub Pages**

1. Fork this repository.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Push to `main` (or run *Deploy to GitHub Pages* from the Actions tab). Your copy will be served at `https://<user>.github.io/<repo>/`.

Links are derived from `GITHUB_REPOSITORY` at build time, so no configuration is needed. For a custom domain, set the `SITE_URL` environment variable.

**Anywhere else:** run `npm run build` and upload `dist/` to Cloudflare Pages, Vercel, Netlify, nginx… Asset URLs are relative, so any sub-path works.

## 🛠️ How it works

- **Rendering** — the watermark is drawn opaque onto a separate layer and then composited with the chosen opacity, so outlines, shadows and overlapping tiles never stack up into darker spots. Very large images are processed in bands to bound memory use.
- **PDF “keep text”** — [pdf-lib](https://github.com/Hopding/pdf-lib) places a transparent watermark layer on every page, honoring `/Rotate` and crop boxes. Pages of the same size share one image, so files barely grow.
- **PDF “flatten”** — [pdf.js](https://github.com/mozilla/pdf.js) renders each page at the chosen DPI; the watermarked images are assembled into a new PDF.
- **Stack** — Vue 3, TypeScript, Vite, [fflate](https://github.com/101arrowz/fflate) for ZIP files and [Lucide](https://lucide.dev/) icons.

## 🧭 Browser support

Use a current version of Chrome, Edge, Safari or Firefox (desktop or mobile). The build targets Chrome/Edge 100+, Safari/iOS 15.4+ and Firefox 100+.

## 🤝 Contributing

Issues and pull requests are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md). Please report security or privacy problems privately as described in [SECURITY.md](SECURITY.md).

## 📄 License

[MIT](LICENSE) © SafeMark contributors
