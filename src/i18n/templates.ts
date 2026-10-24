import type { Locale } from '.'

/** Ready-made watermark texts offered in the content section. */
export const TEXT_TEMPLATES: Record<Locale, string[]> = {
  'zh-CN': [
    '仅供 XX 办理 XX 业务使用\n他用无效',
    '仅供 XX 使用，复印无效',
    '机密文件 · 严禁外传',
    '内部资料 · 注意保密',
    '样本 SAMPLE',
    '版权所有 · 盗用必究',
    '{filename} · {date}',
  ],
  en: [
    'For XX use only',
    'CONFIDENTIAL',
    'INTERNAL USE ONLY',
    'DRAFT',
    'SAMPLE',
    '© Your Name',
    '{filename} · {date}',
  ],
}
