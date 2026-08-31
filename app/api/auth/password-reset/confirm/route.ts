import { createHash, timingSafeEqual } from 'crypto'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import { registrarAuditoria } from '@/lib/audit-server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function tokenHashMatches(token: string, expectedHash: string) {
  const received = Buffer.from(hashToken(token), 'hex')
  const expected = Buffer.from(expectedHash, 'hex')
  return received.length === expected.length && timingSafeEqual(received, expected)
}

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const token = String(payload.token ?? '')
    const password = String(payload.password ?? '')

    if (token.length < 20) {
      return NextResponse.json({ error: 'Token invalido.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 8 caracteres.' }, { status: 400 })
    }

    const result = await db.query(
      `
        SELECT prt.id, prt.user_id, prt.token_hash, u.email
        FROM public.password_reset_tokens prt
        JOIN public.users u ON u.id = prt.user_id
        WHERE prt.used_at IS NULL
          AND prt.expires_at > now()
        ORDER BY prt.created_at DESC
        LIMIT 25
      `,
    )

    const row = result.rows.find((item) => tokenHashMatches(token, item.token_hash))
    if (!row) return NextResponse.json({ error: 'Token invalido ou expirado.' }, { status: 400 })

    const passwordHash = await bcrypt.hash(password, 12)
    const client = await db.connect()
    try {
      await client.query('BEGIN')
      await client.query('UPDATE public.users SET password_hash = $2 WHERE id = $1', [
        row.user_id,
        passwordHash,
      ])
      await client.query('UPDATE public.password_reset_tokens SET used_at = now() WHERE id = $1', [
        row.id,
      ])
      await client.query(
        `
          UPDATE public.user_sessions
          SET revoked_at = now()
          WHERE user_id = $1
            AND revoked_at IS NULL
        `,
        [row.user_id],
      )
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }

    await registrarAuditoria({
      actor: { type: 'requester', label: row.email },
      category: 'autenticacao',
      action: 'password_reset_concluido',
      details: { email: row.email },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
