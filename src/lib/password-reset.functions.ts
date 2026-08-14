import { createServerFn } from '@tanstack/react-start'

export const requestPasswordReset = createServerFn({ method: 'POST' })
  .inputValidator((input: { email: string }) => {
    const email = String(input?.email ?? '').trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
      throw new Error('Please enter a valid email address.')
    }
    return { email }
  })
  .handler(async ({ data }) => {
    const { getRequest } = await import('@tanstack/react-start/server')
    const { issuePasswordReset } = await import('./password-reset.server')
    let url: string | undefined
    try {
      url = getRequest()?.url
    } catch {
      url = undefined
    }
    await issuePasswordReset(data.email, url)
    // Same response regardless of whether the address exists.
    return { ok: true }
  })

export const validateResetToken = createServerFn({ method: 'POST' })
  .inputValidator((input: { token: string }) => ({ token: String(input?.token ?? '') }))
  .handler(async ({ data }) => {
    const { checkResetToken } = await import('./password-reset.server')
    return { valid: await checkResetToken(data.token) }
  })

export const submitPasswordReset = createServerFn({ method: 'POST' })
  .inputValidator((input: { token: string; password: string }) => ({
    token: String(input?.token ?? ''),
    password: String(input?.password ?? ''),
  }))
  .handler(async ({ data }) => {
    const { applyPasswordReset } = await import('./password-reset.server')
    return applyPasswordReset(data.token, data.password)
  })
