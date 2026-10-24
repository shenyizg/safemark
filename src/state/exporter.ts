/**
 * Runs exports: renders every selected file at full resolution with the current settings and
 * hands the results to the browser as downloads (a ZIP archive for several files).
 */

import { reactive } from 'vue'

import { allocCanvas, canvasToBlob, releaseCanvas } from '@/core/canvas'
import type { ExportOptions, WatermarkConfig } from '@/core/config'
import { canShareFiles, downloadBlob } from '@/core/download'
import { outputFileName, uniqueFileName } from '@/core/files'
import { EXTENSIONS, watermarkImage } from '@/core/image'
import { PdfEncryptedError, watermarkPdfFlatten, watermarkPdfOverlay } from '@/core/pdf'
import { drawWatermark, type LogoAsset, type WatermarkContent } from '@/core/render'
import { dependsOnPage, resolveTemplate } from '@/core/template'
import { createZipWriter } from '@/core/zip'
import { t, type MessageKey } from '@/i18n'
import { errorMessageKey, withPdfDocument, type FileItem } from './files'
import { config, exportOptions, logo } from './settings'
import { showToast } from './toasts'

export interface ExportResult {
  name: string
  blob: Blob
  notes: MessageKey[]
}

export const exportState = reactive({
  running: false,
  /** Files finished so far and in total. */
  done: 0,
  total: 0,
  /** Progress within the current file, 0–1. */
  fileProgress: 0,
  currentName: '',
})

let controller: AbortController | null = null

export function cancelExport(): void {
  controller?.abort()
}

interface Job {
  config: WatermarkConfig
  options: ExportOptions
  logo: LogoAsset | null
  now: Date
  signal: AbortSignal
  onProgress: (done: number, total: number) => void
}

function content(job: Job, item: FileItem, page: number, pages: number): WatermarkContent {
  const text = resolveTemplate(job.config.text, { fileName: item.name, page, pages, now: job.now })
  return { text, logo: job.logo }
}

async function exportImage(item: FileItem, job: Job): Promise<ExportResult> {
  const result = await watermarkImage(item.file, job.config, content(job, item, 1, 1), job.options)
  const ext = EXTENSIONS[result.blob.type] ?? 'png'
  return {
    name: outputFileName(item.name, job.options.suffix, ext),
    blob: result.blob,
    notes: result.scale < 1 ? ['notes.downscaled'] : [],
  }
}

async function overlayPdf(item: FileItem, job: Job): Promise<Uint8Array> {
  const bytes = new Uint8Array(await item.file.arrayBuffer())
  return watermarkPdfOverlay(bytes, {
    perPage: dependsOnPage(job.config.text),
    signal: job.signal,
    onProgress: job.onProgress,
    renderLayer: async (size, index) => {
      const pxPerPt = job.options.pdfDpi / 72
      const { canvas, ctx } = allocCanvas(size.width * pxPerPt, size.height * pxPerPt)
      try {
        drawWatermark(ctx, canvas, job.config, content(job, item, index + 1, item.pages))
        return new Uint8Array(await (await canvasToBlob(canvas, 'image/png')).arrayBuffer())
      } finally {
        releaseCanvas(canvas)
      }
    },
  })
}

function flattenPdf(item: FileItem, job: Job): Promise<Uint8Array> {
  return withPdfDocument(item, (doc) =>
    watermarkPdfFlatten(doc, {
      dpi: job.options.pdfDpi,
      quality: job.options.quality / 100,
      signal: job.signal,
      onProgress: job.onProgress,
      paint: (ctx, size, index) =>
        drawWatermark(ctx, size, job.config, content(job, item, index + 1, doc.numPages)),
    }),
  )
}

async function exportPdf(item: FileItem, job: Job): Promise<ExportResult> {
  const notes: MessageKey[] = []
  let bytes: Uint8Array | null = null
  if (job.options.pdfMode === 'overlay') {
    try {
      bytes = await overlayPdf(item, job)
    } catch (error) {
      if (job.signal.aborted) throw error
      // pdf.js can render (and therefore flatten) many files pdf-lib cannot edit.
      console.warn(`Overlay failed for ${item.name}, flattening instead`, error)
      notes.push(
        error instanceof PdfEncryptedError ? 'notes.encryptedFlattened' : 'notes.overlayFallback',
      )
    }
  }
  bytes ??= await flattenPdf(item, job)
  return {
    name: outputFileName(item.name, job.options.suffix, 'pdf'),
    blob: new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' }),
    notes,
  }
}

const nextFrame = () => new Promise<void>((resolve) => setTimeout(resolve, 16))

function timestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`
}

function isMobile(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches
}

function offerShare(result: ExportResult) {
  const file = new File([result.blob], result.name, { type: result.blob.type })
  if (!isMobile() || !result.blob.type.startsWith('image/') || !canShareFiles([file])) return
  showToast(t('export.shareHint'), 'info', {
    timeout: 12_000,
    action: {
      label: t('export.share'),
      run: () => void navigator.share({ files: [file] }).catch(() => {}),
    },
  })
}

/** Exports the given files. Resolves when the downloads have been handed to the browser. */
export async function exportFiles(list: readonly FileItem[]): Promise<void> {
  if (exportState.running) return
  const ready = list.filter((item) => item.status === 'ready')
  if (!ready.length) return

  controller = new AbortController()
  const { signal } = controller
  Object.assign(exportState, {
    running: true,
    done: 0,
    total: ready.length,
    fileProgress: 0,
    currentName: '',
  })
  const job: Job = {
    // Snapshots: tweaking settings while an export runs must not affect it.
    config: { ...config },
    options: { ...exportOptions },
    logo: logo.value
      ? { source: logo.value.image, width: logo.value.width, height: logo.value.height }
      : null,
    now: new Date(),
    signal,
    onProgress: (done, total) => {
      exportState.fileProgress = total ? done / total : 0
    },
  }

  // Several files go into a ZIP archive as they are produced, so their data can be released
  // right away instead of piling up until the end.
  const zip = ready.length > 1 ? createZipWriter() : null
  const usedNames = new Set<string>()
  let single: ExportResult | null = null
  let succeeded = 0
  const notes = new Set<MessageKey>()
  const failed: { name: string; reason: MessageKey }[] = []
  try {
    for (const item of ready) {
      signal.throwIfAborted()
      exportState.currentName = item.name
      exportState.fileProgress = 0
      await nextFrame()
      try {
        const result = await (item.kind === 'image' ? exportImage(item, job) : exportPdf(item, job))
        signal.throwIfAborted()
        result.notes.forEach((note) => notes.add(note))
        if (zip) await zip.add(uniqueFileName(result.name, usedNames), result.blob)
        else single = result
        succeeded++
      } catch (error) {
        if (signal.aborted) throw error
        console.error(`Failed to export ${item.name}`, error)
        failed.push({ name: item.name, reason: errorMessageKey(error) })
      }
      exportState.done++
    }

    if (single) {
      downloadBlob(single.blob, single.name)
      offerShare(single)
    } else if (zip && succeeded) {
      exportState.currentName = t('export.zipping')
      await nextFrame()
      downloadBlob(await zip.finish(), `safemark-${timestamp(job.now)}.zip`)
    }

    for (const note of notes) showToast(t(note), 'info', { timeout: 10_000 })
    if (failed.length) {
      const details = failed.map((f) => `${f.name}: ${t(f.reason)}`).join('\n')
      showToast(`${t('export.failed', { count: failed.length })}\n${details}`, 'error')
    } else if (succeeded) {
      showToast(t('export.done', { count: succeeded }), 'success')
    }
  } catch (error) {
    if (signal.aborted) {
      showToast(t('export.cancelled'))
    } else {
      console.error(error)
      showToast(t(errorMessageKey(error)), 'error')
    }
  } finally {
    // Drops the archive's buffers (the downloaded Blob keeps its own copy).
    zip?.abort()
    exportState.running = false
    controller = null
  }
}
