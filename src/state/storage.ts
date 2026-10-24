/**
 * localStorage access that never throws: storage can be unavailable (private browsing,
 * disabled site data) or full, and the app must keep working either way.
 */

const PREFIX = 'safemark:'

export function readStored(key: string): unknown {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw === null ? null : JSON.parse(raw)
  } catch {
    return null
  }
}

export function writeStored(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeStored(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    // Nothing to do.
  }
}
