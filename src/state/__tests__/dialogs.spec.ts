import { describe, expect, it } from 'vitest'

import { dismissPasswordRequests, passwordRequest, requestPassword } from '../dialogs'

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('password prompts', () => {
  it('shows concurrent requests one after another', async () => {
    const first = requestPassword('a', 'a.pdf', false)
    const second = requestPassword('b', 'b.pdf', false)
    await flush()
    expect(passwordRequest.value?.fileName).toBe('a.pdf')

    passwordRequest.value!.resolve('secret-a')
    await expect(first).resolves.toBe('secret-a')
    await flush()
    expect(passwordRequest.value?.fileName).toBe('b.pdf')

    passwordRequest.value!.resolve(null)
    await expect(second).resolves.toBeNull()
    expect(passwordRequest.value).toBeNull()
  })

  it('dismisses the prompt of a removed file', async () => {
    const pending = requestPassword('c', 'c.pdf', false)
    await flush()
    expect(passwordRequest.value?.fileId).toBe('c')
    dismissPasswordRequests('c')
    await expect(pending).resolves.toBeNull()
    expect(passwordRequest.value).toBeNull()
  })

  it('skips queued prompts of removed files without showing them', async () => {
    const shown = requestPassword('d', 'd.pdf', true)
    const queued = requestPassword('e', 'e.pdf', false)
    dismissPasswordRequests('e')
    await flush()
    expect(passwordRequest.value?.fileId).toBe('d')
    expect(passwordRequest.value?.retry).toBe(true)
    passwordRequest.value!.resolve('pw')
    await expect(shown).resolves.toBe('pw')
    await expect(queued).resolves.toBeNull()
    expect(passwordRequest.value).toBeNull()
  })
})
