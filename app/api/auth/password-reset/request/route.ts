import { createHash, randomBytes } from 'crypto'
import { NextResponse } from 'next/server'
import { registrarAuditoria } from '@/lib/audit-server'
import { db } from '@/lib/db'
import { recordEmailDelivery } from '@/lib/email/delivery-log'
import { sendPasswordResetEmail } from '@/lib/email/senders'
import { formatDateTime } from '@/lib/protocols-server'

export const runtime = 'nodejs'

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function appBaseUrl(request: Request) {
  return process.env.APP_BASE_URL || new URL(request.url).origin
}

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const email = String(payload.email ?? '').trim().toLowerCase()
    const neutral = NextResponse.json({
      ok: true,
      message: 'Se o e-mail existir no sistema, enviaremos instrucoes de redefinicao.',
    })

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return neutral

    const userResult = await db.query(
      `
        SELECT id, name, email
        FROM public.users
        WHERE email = $1
          AND is_active = true
        LIMIT 1
      `,
      [email],
    )
    const user = userResult.rows[0]
    if (!user) return neutral

    const token = randomBytes(32).toString('base64url')
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30)

    await db.query(
      `
        INSERT INTO public.password_reset_tokens (user_id, token_hash, expires_at)
        VALUES ($1, $2, $3)
      `,
      [user.id, hashToken(token), expiresAt],
    )

    const resetUrl = new URL('/login', appBaseUrl(request))
    resetUrl.searchParams.set('resetToken', token)

    const emailResult = await sendPasswordResetEmail(user.email, {
      userName: user.name,
      resetUrl: resetUrl.toString(),
      expiresAt: formatDateTime(expiresAt.toISOString()),
    })

    await recordEmailDelivery({
      eventType: 'password_reset',
      recipientEmail: user.email,
      userId: user.id,
      result: emailResult,
    })

    await registrarAuditoria({
      actor: { type: 'requester', label: user.email },
      category: 'autenticacao',
      action: 'password_reset_solicitado',
      details: { email: user.email, emailStatus: emailResult.status, emailError: emailResult.error },
    })

    return neutral
  } catch (error) {
    console.warn('[Auth] Erro ao solicitar redefinicao de senha:', error)
    return NextResponse.json({
      ok: true,
      message: 'Se o e-mail existir no sistema, enviaremos instrucoes de redefinicao.',
    })
  }
}
