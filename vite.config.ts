import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'

import pkg from './package.json' with { type: 'json' }
import { serviceWorker } from './scripts/vite-plugin-service-worker.ts'

const require = createRequire(import.meta.url)
const pdfjsRoot = path.dirname(require.resolve('pdfjs-dist/package.json'))

/**
 * Runtime data files that pdf.js fetches on demand (CJK CMaps, the standard 14 fonts,
 * image decoders and ICC profiles). They are served from our own origin so that nothing
 * is ever requested from a third-party CDN.
 */
const PDFJS_ASSETS: Record<string, (file: string) => boolean> = {
  cmaps: (f) => f.endsWith('.bcmap') || f === 'LICENSE',
  standard_fonts: () => true,
  // `quickjs-eval` is only needed for PDF JavaScript, which we never execute.
  wasm: (f) => !f.startsWith('quickjs'),
  iccs: () => true,
}

const MIME_TYPES: Record<string, string> = {
  '.js': 'text/javascript',
  '.wasm': 'application/wasm',
  '.ttf': 'font/ttf',
  '.icc': 'application/vnd.iccprofile',
}

function listPdfjsAssets(): { fileName: string; source: string }[] {
  return Object.entries(PDFJS_ASSETS).flatMap(([dir, include]) =>
    fs
      .readdirSync(path.join(pdfjsRoot, dir))
      .filter(include)
      .map((file) => ({
        fileName: `pdfjs/${dir}/${file}`,
        source: path.join(pdfjsRoot, dir, file),
      })),
  )
}

function pdfjsAssets(): Plugin {
  return {
    name: 'safemark:pdfjs-assets',
    configureServer(server) {
      const files = new Map(listPdfjsAssets().map((a) => [`/${a.fileName}`, a.source]))
      server.middlewares.use((req, res, next) => {
        const source = files.get((req.url ?? '').split('?')[0] ?? '')
        if (!source) return next()
        res.setHeader(
          'Content-Type',
          MIME_TYPES[path.extname(source)] ?? 'application/octet-stream',
        )
        fs.createReadStream(source).pipe(res)
      })
    },
    generateBundle() {
      for (const asset of listPdfjsAssets()) {
        this.emitFile({
          type: 'asset',
          fileName: asset.fileName,
          source: fs.readFileSync(asset.source),
        })
      }
    },
  }
}

/**
 * A strict Content-Security-Policy for the production build. Besides the usual hardening, it
 * makes the privacy promise verifiable: the page is not allowed to talk to any other origin,
 * so user files cannot be sent anywhere even by accident.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data: blob:",
  "connect-src 'self' data: blob:",
  "worker-src 'self' blob:",
  "media-src 'self' data: blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ')

function contentSecurityPolicy(): Plugin {
  return {
    name: 'safemark:csp',
    apply: 'build',
    // Right after <meta charset>, before any script or stylesheet it has to govern.
    transformIndexHtml(html) {
      const meta = `<meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}" />`
      return html.replace(/<meta charset[^>]*>/i, (charset) => `${charset}\n    ${meta}`)
    },
  }
}

// In GitHub Actions these resolve to the repository the site is built from, so forks link to
// themselves without any configuration. `SITE_URL` overrides the address (e.g. custom domains).
const repository = process.env.GITHUB_REPOSITORY
const repoUrl = repository
  ? `https://github.com/${repository}`
  : pkg.repository.url.replace(/^git\+/, '').replace(/\.git$/, '')

function pagesUrl(): string {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/?$/, '/')
  if (!repository) return pkg.homepage
  const [owner, repo] = repository.split('/') as [string, string]
  const host = `${owner.toLowerCase()}.github.io`
  return repo.toLowerCase() === host ? `https://${host}/` : `https://${host}/${repo}/`
}

/** Absolute URLs in index.html (link previews need an absolute og:image). */
function siteUrl(): Plugin {
  return {
    name: 'safemark:site-url',
    transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', pagesUrl()),
  }
}

// https://vite.dev/config/
export default defineConfig({
  // Relative asset URLs: the build works on GitHub Pages project sites (/<repo>/), custom
  // domains and any other static host without changing the config.
  base: './',
  plugins: [vue(), pdfjsAssets(), contentSecurityPolicy(), siteUrl(), serviceWorker()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __REPO_URL__: JSON.stringify(repoUrl),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: ['es2022', 'chrome100', 'safari15.4', 'firefox100'],
    // Attribution for every bundled dependency, linked from the About dialog.
    license: { fileName: 'third-party-licenses.txt' },
    // pdf.js is large but lazily loaded only when a PDF is opened.
    chunkSizeWarningLimit: 1600,
  },
  worker: {
    format: 'es',
  },
})
