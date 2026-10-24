import { shallowRef } from 'vue'

export interface PasswordRequest {
  /** The file the password is for. */
  fileId: string
  fileName: string
  /** The previous attempt was wrong. */
  retry: boolean
  resolve: (password: string | null) => void
}

/** The password prompt currently shown, if any. */
export const passwordRequest = shallowRef<PasswordRequest | null>(null)

let queue: Promise<unknown> = Promise.resolve()
/** Files removed while their prompt was waiting in the queue. */
const dismissed = new Set<string>()

/** Asks for a PDF password. Concurrent requests are shown one after another. */
export function requestPassword(
  fileId: string,
  fileName: string,
  retry: boolean,
): Promise<string | null> {
  const next = queue.then(
    () =>
      new Promise<string | null>((resolve) => {
        if (dismissed.has(fileId)) {
          resolve(null)
          return
        }
        passwordRequest.value = {
          fileId,
          fileName,
          retry,
          resolve: (password) => {
            passwordRequest.value = null
            resolve(password)
          },
        }
      }),
  )
  queue = next
  return next
}

/** Gives up on the password prompts of a file that is no longer open. */
export function dismissPasswordRequests(fileId: string): void {
  dismissed.add(fileId)
  if (passwordRequest.value?.fileId === fileId) passwordRequest.value.resolve(null)
}
