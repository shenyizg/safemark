import { Zip, ZipPassThrough } from 'fflate'

export interface ZipEntry {
  name: string
  data: Blob
}

export interface ZipWriter {
  /** Appends a file. Its data can be released as soon as this resolves. */
  add(name: string, data: Blob): Promise<void>
  /** Completes the archive. */
  finish(): Promise<Blob>
  /** Discards the archive. */
  abort(): void
}

/**
 * Builds a ZIP archive incrementally. Entries are stored without compression: images and PDFs
 * are already compressed, so deflating them again would only cost time.
 */
export function createZipWriter(): ZipWriter {
  const chunks: Uint8Array<ArrayBuffer>[] = []
  let resolve!: (blob: Blob) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<Blob>((res, rej) => {
    resolve = res
    reject = rej
  })
  let failure: unknown = null
  // Avoid an unhandled rejection when the archive is aborted before `finish` is called.
  promise.catch(() => {})

  const zip = new Zip((error, chunk, final) => {
    if (error) {
      failure = error
      reject(error)
      return
    }
    chunks.push(chunk as Uint8Array<ArrayBuffer>)
    if (final) resolve(new Blob(chunks, { type: 'application/zip' }))
  })

  return {
    async add(name, data) {
      if (failure) throw failure
      const bytes = new Uint8Array(await data.arrayBuffer())
      const file = new ZipPassThrough(name)
      file.mtime = new Date()
      zip.add(file)
      file.push(bytes, true)
    },
    finish() {
      zip.end()
      return promise
    },
    abort() {
      zip.terminate()
      chunks.length = 0
    },
  }
}

export async function createZip(entries: readonly ZipEntry[]): Promise<Blob> {
  const writer = createZipWriter()
  for (const entry of entries) await writer.add(entry.name, entry.data)
  return writer.finish()
}
