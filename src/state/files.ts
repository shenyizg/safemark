/**
 * The list of opened files. Files are read straight from disk by the browser and stay in
 * memory; nothing is uploaded or written anywhere.
 */

import type { PDFDocumentProxy } from 'pdfjs-dist'
import { computed, reactive, ref, watch } from 'vue'

import { canvasToBlob, releaseCanvas } from '@/core/canvas'
import { detectKind, type FileKind } from '@/core/files'
import { decodeImage, ImageDecodeError, scaledCopy } from '@/core/image'
import { openPdf, PdfPasswordError, renderPage } from '@/core/pdf'
import type { MessageKey } from '@/i18n'
import { dismissPasswordRequests, requestPassword } from './dialogs'

export type FileStatus = 'loading' | 'ready' | 'error'

export interface FileItem {
  id: string
  file: File
  name: string
  kind: FileKind
  size: number
  status: FileStatus
  error: MessageKey | null
  thumbnail: string | null
  /** Pixels for images; points of the first page for PDFs. */
  width: number
  height: number
  pages: number
}

export const items = reactive<FileItem[]>([])
export const activeId = ref<string | null>(null)
/** 1-based page shown in the preview. */
export const activePage = ref(1)
export const activeItem = computed(() => items.find((item) => item.id === activeId.value) ?? null)

watch(activeId, () => {
  activePage.value = 1
})

const THUMBNAIL_SIZE = 240
/** Opened PDFs keep memory in the worker, so only the most recently used ones stay open. */
const MAX_OPEN_PDFS = 6
/** Files decoded at the same time while building thumbnails. */
const LOAD_CONCURRENCY = 2

let idCounter = 0

interface OpenPdf {
  promise: Promise<PDFDocumentProxy>
  lastUsed: number
  /** Operations currently using the document; it is never closed while they run. */
  users: number
}

const openPdfs = new Map<string, OpenPdf>()
/** Passwords that worked, so a file closed to save memory can be reopened silently. */
const pdfPasswords = new Map<string, string>()

function closePdf(id: string) {
  const entry = openPdfs.get(id)
  if (!entry) return
  openPdfs.delete(id)
  void entry.promise.then((doc) => doc.loadingTask.destroy()).catch(() => {})
}

function evictPdfs() {
  const idle = [...openPdfs.entries()]
    .filter(([id, entry]) => entry.users === 0 && id !== activeId.value)
    .sort((a, b) => a[1].lastUsed - b[1].lastUsed)
  while (openPdfs.size > MAX_OPEN_PDFS && idle.length) closePdf(idle.shift()![0])
}

function openEntry(item: FileItem): OpenPdf {
  const open = openPdfs.get(item.id)
  if (open) return open
  let tried: string | undefined
  const promise = (async () => {
    const data = new Uint8Array(await item.file.arrayBuffer())
    const doc = await openPdf(data, {
      password: pdfPasswords.get(item.id),
      requestPassword: async (retry) => {
        const password = await requestPassword(item.id, item.name, retry)
        if (password !== null) tried = password
        return password
      },
    })
    if (tried !== undefined) pdfPasswords.set(item.id, tried)
    return doc
  })()
  const entry: OpenPdf = { promise, lastUsed: performance.now(), users: 0 }
  openPdfs.set(item.id, entry)
  promise.catch(() => {
    if (openPdfs.get(item.id) === entry) openPdfs.delete(item.id)
  })
  return entry
}

/** Runs `use` with the item's pdf.js document, which stays open at least until it finishes. */
export async function withPdfDocument<T>(
  item: FileItem,
  use: (doc: PDFDocumentProxy) => Promise<T> | T,
): Promise<T> {
  const entry = openEntry(item)
  entry.users++
  entry.lastUsed = performance.now()
  try {
    return await use(await entry.promise)
  } finally {
    entry.users--
    // The file may have been removed while the document was in use.
    if (entry.users === 0 && !items.includes(item) && openPdfs.get(item.id) === entry) {
      closePdf(item.id)
    }
    evictPdfs()
  }
}

export function errorMessageKey(error: unknown): MessageKey {
  if (error instanceof ImageDecodeError) return 'errors.imageDecode'
  if (error instanceof PdfPasswordError) return 'errors.pdfPassword'
  const name = (error as { name?: string } | null)?.name
  if (name === 'InvalidPDFException') return 'errors.pdfInvalid'
  if (name === 'CanvasTooLargeError') return 'errors.tooLarge'
  return 'errors.generic'
}

async function thumbnailUrl(canvas: HTMLCanvasElement): Promise<string> {
  try {
    return URL.createObjectURL(await canvasToBlob(canvas, 'image/png'))
  } finally {
    releaseCanvas(canvas)
  }
}

async function loadImage(item: FileItem) {
  const decoded = await decodeImage(item.file)
  try {
    item.width = decoded.width
    item.height = decoded.height
    item.pages = 1
    item.thumbnail = await thumbnailUrl(
      scaledCopy(decoded.image, decoded.width, decoded.height, THUMBNAIL_SIZE),
    )
  } finally {
    decoded.dispose()
  }
}

async function loadPdf(item: FileItem) {
  await withPdfDocument(item, async (doc) => {
    item.pages = doc.numPages
    const page = await doc.getPage(1)
    const viewport = page.getViewport({ scale: 1 })
    item.width = viewport.width
    item.height = viewport.height
    const scale = THUMBNAIL_SIZE / Math.max(viewport.width, viewport.height)
    item.thumbnail = await thumbnailUrl(await renderPage(page, scale).promise)
  })
}

const queue: FileItem[] = []
let running = 0

function pump() {
  while (running < LOAD_CONCURRENCY && queue.length) {
    const item = queue.shift()!
    running++
    void load(item).finally(() => {
      running--
      pump()
    })
  }
}

async function load(item: FileItem) {
  try {
    await (item.kind === 'image' ? loadImage(item) : loadPdf(item))
    item.status = 'ready'
  } catch (error) {
    console.warn(`Failed to open ${item.name}`, error)
    item.status = 'error'
    item.error = errorMessageKey(error)
  }
  // Removed while loading: release what was just created.
  if (!items.includes(item)) disposeItem(item)
}

export interface AddResult {
  added: FileItem[]
  unsupported: string[]
}

export function addFiles(files: Iterable<File>): AddResult {
  const result: AddResult = { added: [], unsupported: [] }
  for (const file of files) {
    const kind = detectKind(file)
    if (!kind) {
      result.unsupported.push(file.name)
      continue
    }
    const item = reactive<FileItem>({
      id: `f${++idCounter}`,
      file,
      name: file.name || (kind === 'pdf' ? 'document.pdf' : 'image.png'),
      kind,
      size: file.size,
      status: 'loading',
      error: null,
      thumbnail: null,
      width: 0,
      height: 0,
      pages: 0,
    }) as FileItem
    items.push(item)
    result.added.push(item)
    queue.push(item)
  }
  if (!activeItem.value && result.added[0]) activeId.value = result.added[0].id
  pump()
  return result
}

function disposeItem(item: FileItem) {
  if (item.thumbnail) URL.revokeObjectURL(item.thumbnail)
  item.thumbnail = null
  closePdf(item.id)
  pdfPasswords.delete(item.id)
}

export function removeItem(id: string): void {
  const index = items.findIndex((item) => item.id === id)
  if (index < 0) return
  const [item] = items.splice(index, 1)
  dismissPasswordRequests(id)
  const queued = queue.indexOf(item!)
  if (queued >= 0) queue.splice(queued, 1)
  if (item!.status !== 'loading' || queued >= 0) disposeItem(item!)
  if (activeId.value === id) {
    activeId.value = (items[index] ?? items[index - 1])?.id ?? null
  }
}

export function clearItems(): void {
  for (const item of [...items]) removeItem(item.id)
}
