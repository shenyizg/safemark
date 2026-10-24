/** File naming and type detection helpers. */

export type FileKind = 'image' | 'pdf'

const IMAGE_EXTENSIONS = /\.(png|jpe?g|jfif|pjpeg|pjp|webp|gif|bmp|avif|svg|ico|heic|heif|tiff?)$/i

export function detectKind(file: { name: string; type: string }): FileKind | null {
  if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) return 'pdf'
  if (file.type.startsWith('image/') || IMAGE_EXTENSIONS.test(file.name)) return 'image'
  return null
}

export function splitExtension(name: string): { base: string; ext: string } {
  const dot = name.lastIndexOf('.')
  if (dot <= 0 || dot === name.length - 1) return { base: name, ext: '' }
  return { base: name.slice(0, dot), ext: name.slice(dot + 1) }
}

/** Removes characters that are invalid in file names on common operating systems. */
export function sanitizeFileName(name: string): string {
  const cleaned = name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').replace(/[. ]+$/, '')
  return cleaned || 'file'
}

/** `photo.jpg` + `_watermarked` + `png` → `photo_watermarked.png`. */
export function outputFileName(original: string, suffix: string, ext: string): string {
  const { base } = splitExtension(original)
  return sanitizeFileName(`${base}${suffix}.${ext}`)
}

/**
 * Returns `name`, or `name (2)`, `name (3)`, … (before the extension) if it is already in `used`
 * (compared case-insensitively). Records the returned name in `used`.
 */
export function uniqueFileName(name: string, used: Set<string>): string {
  let candidate = name
  const { base, ext } = splitExtension(name)
  for (let n = 2; used.has(candidate.toLowerCase()); n++) {
    candidate = ext ? `${base} (${n}).${ext}` : `${base} (${n})`
  }
  used.add(candidate.toLowerCase())
  return candidate
}

/** Makes names unique, see `uniqueFileName`. */
export function dedupeFileNames(names: readonly string[]): string[] {
  const used = new Set<string>()
  return names.map((name) => uniqueFileName(name, used))
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`
}
