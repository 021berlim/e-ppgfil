import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'
import { updateOwnProfile } from '@/lib/profile'
import { registrarAuditoria } from '@/lib/audit-server'

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 })
    }

    const payload = await request.json()
    const updated = await updateOwnProfile(user, payload)
    await registrarAuditoria({
      actor: { type: 'user', user },
      category: 'sistema',
      action: 'perfil_atualizado',
      details: {
        email: updated.email,
        avatarChanged: payload.avatar_url !== undefined,
        passwordChanged: Boolean(payload.newPassword),
      },
    })
    return NextResponse.json(updated)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
