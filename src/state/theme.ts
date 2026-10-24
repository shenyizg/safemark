import { ref, watch } from 'vue'

import { readStored, writeStored } from './storage'

export type ThemePreference = 'system' | 'light' | 'dark'

const saved = readStored('theme')
export const theme = ref<ThemePreference>(saved === 'light' || saved === 'dark' ? saved : 'system')

watch(
  theme,
  (value) => {
    writeStored('theme', value)
    const root = document.documentElement
    if (value === 'system') delete root.dataset.theme
    else root.dataset.theme = value
  },
  { immediate: true },
)

export function cycleTheme(): void {
  theme.value = theme.value === 'system' ? 'light' : theme.value === 'light' ? 'dark' : 'system'
}
