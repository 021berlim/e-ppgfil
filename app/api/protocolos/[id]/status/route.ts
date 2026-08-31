import { NextResponse } from 'next/server'
import { registrarAuditoria } from '@/lib/audit-server'
import { requireWriteAdmin } from '@/lib/auth-server'
import { recordEmailDelivery } from '@/lib/email/delivery-log'
import { sendProtocolStatusUpdateEmail } from '@/lib/email/senders'
import { consultationUrl, formatDateTime, updateProtocolStatus } from '@/lib/protocols-server'

export const runtime = 'nodejs'

function errorResponse(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : 'Erro inesperado.'
  return NextResponse.json({ error: message }, { status })
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireWriteAdmin()
    const { id } = await context.params
    const payload = await request.json()
    const status = String(payload.status ?? '')
    const observation = typeof payload.observation === 'string' ? payload.observation : undefined
    const baseUrl = process.env.APP_BASE_URL || new URL(request.url).origin

    const update = await updateProtocolStatus({
      id,
      status,
      observation,
      authorUserId: actor?.id ?? null,
      authorName: actor?.name || actor?.email || 'Secretaria',
    })

    const emailResult = await sendProtocolStatusUpdateEmail(update.requesterEmail, {
      requesterName: update.requesterName,
      protocolNumber: update.protocolNumber,
      previousStatus: update.previousStatus,
      currentStatus: update.currentStatus,
      observation: update.observation,
      updatedAt: formatDateTime(update.updatedAt),
      consultationUrl: consultationUrl(baseUrl, update.protocolNumber),
    })

    await recordEmailDelivery({
      eventType: 'protocol_status_update',
      recipientEmail: update.requesterEmail,
      protocolId: update.protocolId,
      userId: actor?.id ?? null,
      result: emailResult,
      metadata: {
        protocolNumber: update.protocolNumber,
        previousStatus: update.previousStatus,
        currentStatus: update.currentStatus,
      },
    })

    await registrarAuditoria({
      actor: { type: 'user', user: actor },
      category: 'protocolo',
      action: 'protocolo_status_atualizado',
      protocolId: update.protocolId,
      protocolNumber: update.protocolNumber,
      details: {
        previousStatus: update.previousStatus,
        currentStatus: update.currentStatus,
        emailStatus: emailResult.status,
        emailError: emailResult.error,
      },
    })

    return NextResponse.json({ ok: true, update, emailStatus: emailResult.status })
  } catch (error) {
    return errorResponse(error)
  }
}
