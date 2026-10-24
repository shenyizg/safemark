/** Opens the system file picker. Resolves with the chosen files (empty if cancelled). */
export function pickFiles(options: { accept: string; multiple?: boolean }): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = options.accept
    input.multiple = options.multiple ?? false
    input.style.display = 'none'
    const finish = (files: File[]) => {
      input.remove()
      resolve(files)
    }
    input.addEventListener('change', () => finish(Array.from(input.files ?? [])), { once: true })
    input.addEventListener('cancel', () => finish([]), { once: true })
    // Some mobile browsers only open pickers for inputs that are in the document.
    document.body.append(input)
    input.click()
  })
}

export const DOCUMENT_ACCEPT = 'image/*,application/pdf,.pdf,.heic,.heif'

/** Collects files from a drop, descending into dropped folders. */
export async function filesFromDataTransfer(data: DataTransfer): Promise<File[]> {
  const entries = Array.from(data.items ?? [])
    .filter((item) => item.kind === 'file')
    .map((item) => item.webkitGetAsEntry?.() ?? null)
  if (!entries.length || entries.some((entry) => entry === null)) {
    return Array.from(data.files ?? [])
  }
  const files: File[] = []
  const visit = async (entry: FileSystemEntry): Promise<void> => {
    if (entry.isFile) {
      files.push(
        await new Promise<File>((resolve, reject) =>
          (entry as FileSystemFileEntry).file(resolve, reject),
        ),
      )
    } else if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader()
      // readEntries returns results in batches until it yields an empty list.
      for (;;) {
        const batch = await new Promise<FileSystemEntry[]>((resolve, reject) =>
          reader.readEntries(resolve, reject),
        )
        if (!batch.length) break
        for (const child of batch) await visit(child)
      }
    }
  }
  for (const entry of entries) await visit(entry!)
  return files
}
