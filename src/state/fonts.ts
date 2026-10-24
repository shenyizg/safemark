import { reactive } from 'vue'

import {
  CANDIDATE_FONTS,
  detectInstalledFonts,
  loadFontFile,
  queryLocalFontFamilies,
  type FontCandidate,
} from '@/core/fonts'

export const fonts = reactive({
  /** Well-known families found on this device. */
  detected: [] as FontCandidate[],
  /** Every installed family, once the user granted Local Font Access. */
  local: [] as string[],
  /** Fonts loaded from files during this visit. */
  custom: [] as { family: string; label: string }[],
  detecting: true,
})

export function detectFonts(): void {
  const run = () => {
    fonts.detected = detectInstalledFonts(CANDIDATE_FONTS)
    fonts.detecting = false
  }
  // Probing ~150 fonts takes a few milliseconds; keep it off the critical path anyway.
  if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 1500 })
  else setTimeout(run, 200)
}

export async function loadLocalFonts(): Promise<number> {
  const known = new Set(fonts.detected.map((font) => font.family))
  fonts.local = (await queryLocalFontFamilies()).filter((family) => !known.has(family))
  return fonts.local.length
}

export async function addFontFile(file: File): Promise<string> {
  const font = await loadFontFile(file)
  fonts.custom.push(font)
  return font.family
}
