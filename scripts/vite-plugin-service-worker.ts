import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import type { Plugin, ResolvedConfig } from 'vite'

const TEMPLATE = path.join(import.meta.dirname, 'sw.template.js')

/**
 * Data files that pdf.js fetches only for some documents (CMaps, standard fonts, image
 * decoders). They are cached the first time they are used instead of being downloaded up front.
 */
const RUNTIME_CACHED = /^pdfjs\//

/** Files the app itself never requests (link previews, docs). */
const NOT_CACHED = /^(og-image\.png|third-party-licenses\.txt)$/

function listFiles(dir: string, base = dir): string[] {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return listFiles(full, base)
    return [path.relative(base, full).split(path.sep).join('/')]
  })
}

/**
 * Generates `sw.js` with a precache manifest of the build output. The cache version is a hash
 * of the precached files, so every deploy that changes the app installs a fresh cache.
 */
export function serviceWorker(): Plugin {
  let config: ResolvedConfig

  return {
    name: 'safemark:service-worker',
    apply: 'build',
    enforce: 'post',
    configResolved(resolved) {
      config = resolved
    },
    generateBundle(_options, bundle) {
      const hash = crypto.createHash('sha256')
      const precache = new Set<string>(['index.html'])
      // The page is emitted after this hook runs, so hash its template instead.
      hash.update(fs.readFileSync(path.join(config.root, 'index.html')))

      for (const [fileName, output] of Object.entries(bundle)) {
        if (
          RUNTIME_CACHED.test(fileName) ||
          NOT_CACHED.test(fileName) ||
          fileName.endsWith('.map')
        ) {
          continue
        }
        precache.add(fileName)
        hash.update(fileName)
        hash.update(output.type === 'chunk' ? output.code : output.source)
      }
      if (config.publicDir) {
        for (const fileName of listFiles(config.publicDir)) {
          if (NOT_CACHED.test(fileName)) continue
          precache.add(fileName)
          hash.update(fileName)
          hash.update(fs.readFileSync(path.join(config.publicDir, fileName)))
        }
      }

      const source = fs
        .readFileSync(TEMPLATE, 'utf8')
        .replace('__SW_VERSION__', hash.digest('hex').slice(0, 12))
        .replace('__SW_PRECACHE__', JSON.stringify([...precache].sort(), null, 2))

      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}
