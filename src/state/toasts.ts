import { reactive } from 'vue'

export type ToastKind = 'info' | 'success' | 'error'

export interface Toast {
  id: number
  kind: ToastKind
  message: string
  action?: { label: string; run: () => void }
}

export const toasts = reactive<Toast[]>([])

let nextId = 1

export function dismissToast(id: number): void {
  const index = toasts.findIndex((toast) => toast.id === id)
  if (index >= 0) toasts.splice(index, 1)
}

export function showToast(
  message: string,
  kind: ToastKind = 'info',
  options: { timeout?: number; action?: Toast['action'] } = {},
): number {
  const id = nextId++
  toasts.push({ id, kind, message, action: options.action })
  const timeout = options.timeout ?? (kind === 'error' ? 8000 : 4000)
  if (timeout > 0) setTimeout(() => dismissToast(id), timeout)
  return id
}
