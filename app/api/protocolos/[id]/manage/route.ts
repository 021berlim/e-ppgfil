import { NextResponse } from 'next/server'
import { registrarAuditoria } from '@/lib/audit-server'
import { getCurrentUser, requireWriteAdmin } from '@/lib/auth-server'
import { manageProtocol } from '@/lib/protocols-server'

export const runtime = 'nodejs'

const actions = ['assign', 'note', 'archive', 'unarchive', 'reject_requirement'] as const

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const payload = await request.json()
    const action = String(payload.action ?? '')
    if (!actions.includes(action as (typeof actions)[number])) throw new Error('Acao invalida.')
    const actor = action === 'note' ? await getCurrentUser() : await requireWriteAdmin()
    if (!actor?.id) throw new Error('Usuario nao identificado.')

    const result = await manageProtocol({
      id,
      action: action as (typeof actions)[number],
      value: typeof payload.value === 'string' ? payload.value : undefined,
      authorUserId: actor.id,
      authorName: actor.name || actor.email,
    })
    await registrarAuditoria({
      actor: { type: 'user', user: actor },
      category: 'protocolo',
      action: `protocolo_${action}`,
      protocolId: result.protocolId,
      protocolNumber: result.protocolNumber,
      details: { message: result.message },
    })
    return NextResponse.json({ ok: true, result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
