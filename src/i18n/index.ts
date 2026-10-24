import { ref, watch } from 'vue'

import { readStored, writeStored } from '@/state/storage'
import en from './en'
import zhCN, { type MessageKey } from './zh-CN'

export type { MessageKey }
export type Locale = 'zh-CN' | 'en'

export const LOCALES: { value: Locale; label: string }[] = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en', label: 'English' },
]

const messages: Record<Locale, Record<MessageKey, string>> = { 'zh-CN': zhCN, en }

function detectLocale(): Locale {
  const saved = readStored('locale')
  if (saved === 'zh-CN' || saved === 'en') return saved
  const preferred =
    typeof navigator === 'undefined' ? [] : (navigator.languages ?? [navigator.language])
  for (const language of preferred) {
    if (/^zh\b/i.test(language)) return 'zh-CN'
    if (/^en\b/i.test(language)) return 'en'
  }
  return 'en'
}

export const locale = ref<Locale>(detectLocale())

watch(
  locale,
  (value) => {
    writeStored('locale', value)
    if (typeof document === 'undefined') return
    document.documentElement.lang = value
    document.title = t('app.title')
  },
  { immediate: true },
)

/** Translates `key`, replacing `{name}` placeholders with `params` (others are kept as is). */
export function t(key: MessageKey, params?: Record<string, string | number>): string {
  const template = messages[locale.value][key] ?? messages.en[key] ?? key
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  )
}
