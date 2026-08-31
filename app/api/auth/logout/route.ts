import { NextResponse } from 'next/server'
import { clearSession, getCurrentUser } from '@/lib/auth-server'
import { registrarAuditoria } from '@/lib/audit-server'

export async function POST() {
  const user = await getCurrentUser()
  await clearSession()
  await registrarAuditoria({
    actor: user ? { type: 'user', user } : { type: 'system' },
    category: 'autenticacao',
    action: 'logout_realizado',
    details: user ? { email: user.email, role: user.role } : {},
  })
  return NextResponse.json({ ok: true })
}
