/** Saves a blob through the browser's download mechanism. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.rel = 'noopener'
  link.style.display = 'none'
  document.body.append(link)
  link.click()
  link.remove()
  // Some browsers start reading the blob only after the click handler has returned.
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

/** Whether the system share sheet can take files (mostly mobile), e.g. to save to Photos. */
export function canShareFiles(files: File[]): boolean {
  return typeof navigator !== 'undefined' && !!navigator.canShare?.({ files })
}
