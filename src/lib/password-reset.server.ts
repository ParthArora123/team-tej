// Self-contained password reset flow. Reset links, tokens and emails are
// generated and validated by this app's own backend — no Supabase Auth
// recovery links or Supabase-hosted redirects are involved anywhere.
import { createHash, randomBytes, timingSafeEqual } from 'crypto'
import * as React from 'react'
import { render } from '@react-email/render'
import { TEMPLATES } from '@/lib/email-templates/registry'

const TOKEN_TTL_MINUTES = 30
const SITE_NAME = 'Tejas D Dhoke'
const SENDER_DOMAIN = 'notify.tejasdhoke.com'

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function constantTimeEquals(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

async function admin() {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  return supabaseAdmin
}

async function findUserByEmail(email: string) {
  const db = await admin()
  // Paginate the user directory until we find a case-insensitive match.
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 })
    if (error || !data?.users?.length) return null
    const hit = data.users.find((u) => (u.email ?? '').toLowerCase() === email)
    if (hit) return hit
    if (data.users.length < 200) return null
  }
  return null
}

function originFrom(requestUrl: string | null | undefined): string {
  if (requestUrl) {
    try {
      return new URL(requestUrl).origin
    } catch {
      /* fall through */
    }
  }
  return 'https://tejasdhoke.com'
}

/** Creates a single-use reset token and emails the link. Always resolves silently. */
export async function issuePasswordReset(rawEmail: string, requestUrl?: string): Promise<void> {
  const email = rawEmail.trim().toLowerCase()
  const user = await findUserByEmail(email)
  if (!user) return // Do not leak which addresses are registered.

  const db = await admin()

  // Invalidate any outstanding tokens for this account first.
  await db
    .from('password_reset_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('email', email)
    .is('used_at', null)

  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60_000).toISOString()

  const { error } = await db.from('password_reset_tokens').insert({
    user_id: user.id,
    email,
    token_hash: hashToken(token),
    expires_at: expiresAt,
  })
  if (error) {
    console.error('[password-reset] failed to store token', error.message)
    return
  }

  const resetUrl = `${originFrom(requestUrl)}/reset-password?token=${encodeURIComponent(token)}`
  await sendResetEmail({
    to: email,
    name: (user.user_metadata as any)?.full_name ?? '',
    resetUrl,
  })
}

async function sendResetEmail(p: { to: string; name: string; resetUrl: string }) {
  const db = await admin()
  const template = TEMPLATES['password-reset']
  if (!template) return

  // Respect the existing suppression list.
  const { data: suppressed } = await db
    .from('suppressed_emails')
    .select('id')
    .eq('email', p.to)
    .maybeSingle()
  if (suppressed) return

  const element = React.createElement(template.component, {
    name: p.name,
    resetUrl: p.resetUrl,
    expiresInMinutes: TOKEN_TTL_MINUTES,
  })
  const html = await render(element)
  const text = await render(element, { plainText: true })
  const subject = typeof template.subject === 'function' ? template.subject({}) : template.subject
  const messageId = crypto.randomUUID()

  await db.from('email_send_log').insert({
    message_id: messageId,
    template_name: 'password-reset',
    recipient_email: p.to,
    status: 'pending',
  })

  const { error } = await db.rpc('enqueue_email', {
    queue_name: 'transactional_emails',
    payload: {
      message_id: messageId,
      to: p.to,
      from: `${SITE_NAME} <noreply@${SENDER_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject,
      html,
      text,
      purpose: 'transactional',
      label: 'password-reset',
      idempotency_key: messageId,
      queued_at: new Date().toISOString(),
    },
  } as any)

  if (error) {
    console.error('[password-reset] enqueue failed', error.message)
    await db.from('email_send_log').insert({
      message_id: messageId,
      template_name: 'password-reset',
      recipient_email: p.to,
      status: 'failed',
      error_message: 'Failed to enqueue password reset email',
    })
  }
}

async function lookupToken(token: string) {
  if (!token || token.length < 20 || token.length > 200) return null
  const db = await admin()
  const { data } = await db
    .from('password_reset_tokens')
    .select('id, user_id, email, token_hash, expires_at, used_at')
    .eq('token_hash', hashToken(token))
    .maybeSingle()
  if (!data) return null
  if (!constantTimeEquals(data.token_hash, hashToken(token))) return null
  if (data.used_at) return null
  if (new Date(data.expires_at).getTime() < Date.now()) return null
  return data
}

export async function checkResetToken(token: string): Promise<boolean> {
  return (await lookupToken(token)) !== null
}

export async function applyPasswordReset(
  token: string,
  newPassword: string,
): Promise<{ ok: boolean; error?: string }> {
  if (typeof newPassword !== 'string' || newPassword.length < 6) {
    return { ok: false, error: 'Password must be at least 6 characters.' }
  }
  const row = await lookupToken(token)
  if (!row) {
    return {
      ok: false,
      error:
        'Your password reset link is invalid or has expired. Please request a new password reset link.',
    }
  }

  const db = await admin()
  // Consume the token first so a concurrent request cannot reuse it.
  const { data: consumed } = await db
    .from('password_reset_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', row.id)
    .is('used_at', null)
    .select('id')
    .maybeSingle()
  if (!consumed) {
    return {
      ok: false,
      error:
        'Your password reset link is invalid or has expired. Please request a new password reset link.',
    }
  }

  // The password is hashed and stored by the user store; plain text is never persisted.
  const { error } = await db.auth.admin.updateUserById(row.user_id, { password: newPassword })
  if (error) {
    console.error('[password-reset] update failed', error.message)
    return { ok: false, error: 'Could not update your password. Please request a new link.' }
  }

  // Clean up any other outstanding tokens for this account.
  await db
    .from('password_reset_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('email', row.email)
    .is('used_at', null)

  return { ok: true }
}
