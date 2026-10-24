/**
 * `{variables}` that can be used in the watermark text, e.g. `For XX only · {date}`.
 */

export interface TemplateContext {
  /** Original file name, including the extension. */
  fileName: string
  /** 1-based page number (always 1 for images). */
  page: number
  pages: number
  now: Date
}

export const TEMPLATE_VARIABLES = ['date', 'time', 'datetime', 'filename', 'page', 'pages'] as const

export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number]

const PATTERN = /\{(date|time|datetime|filename|page|pages)\}/gi

const pad = (n: number) => String(n).padStart(2, '0')

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function formatTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function stripExtension(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  return dot > 0 ? fileName.slice(0, dot) : fileName
}

export function resolveTemplate(text: string, ctx: TemplateContext): string {
  return text.replace(PATTERN, (_match, name: string) => {
    switch (name.toLowerCase() as TemplateVariable) {
      case 'date':
        return formatDate(ctx.now)
      case 'time':
        return formatTime(ctx.now)
      case 'datetime':
        return `${formatDate(ctx.now)} ${formatTime(ctx.now)}`
      case 'filename':
        return stripExtension(ctx.fileName)
      case 'page':
        return String(ctx.page)
      case 'pages':
        return String(ctx.pages)
    }
  })
}

/** Whether the text differs from page to page, i.e. each page needs its own watermark. */
export function dependsOnPage(text: string): boolean {
  return /\{page\}/i.test(text)
}
