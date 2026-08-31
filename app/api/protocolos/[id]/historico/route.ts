import { NextResponse } from 'next/server'
import { registrarAuditoria } from '@/lib/audit-server'
import { getCurrentUser } from '@/lib/auth-server'
import { recordEmailDelivery } from '@/lib/email/delivery-log'
import { sendProtocolStatusUpdateEmail } from '@/lib/email/senders'
import {
  addProtocolHistoryEntry,
  consultationUrl,
  formatDateTime,
} from '@/lib/protocols-server'
import type { Anexo } from '@/lib/types'

export const runtime = 'nodejs'

function errorResponse(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : 'Erro inesperado.'
  return NextResponse.json({ error: message }, { status })
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const payload = await request.json()
    const currentUser = await getCurrentUser()
    const origin = payload.origin === 'solicitante' && !currentUser ? 'solicitante' : 'secretaria'
    const message = String(payload.message ?? '')
    const anexos = Array.isArray(payload.anexos) ? (payload.anexos as Anexo[]) : []
    const authorName =
      origin === 'secretaria'
        ? currentUser?.name || currentUser?.email || 'Secretaria'
        : String(payload.authorName ?? 'Solicitante')

    if (origin === 'secretaria' && !currentUser) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    const update = await addProtocolHistoryEntry({
      id,
      message,
      anexos,
      authorUserId: currentUser?.id ?? null,
      authorName,
      origin,
    })
    const baseUrl = process.env.APP_BASE_URL || new URL(request.url).origin
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
      userId: currentUser?.id ?? null,
      result: emailResult,
      metadata: {
        protocolNumber: update.protocolNumber,
        origin,
      },
    })

    await registrarAuditoria({
      actor:
        origin === 'secretaria'
          ? { type: 'user', user: currentUser }
          : { type: 'requester', label: authorName },
      category: 'protocolo',
      action: origin === 'secretaria' ? 'protocolo_andamento_registrado' : 'protocolo_exigencia_respondida',
      protocolId: update.protocolId,
      protocolNumber: update.protocolNumber,
      details: {
        emailStatus: emailResult.status,
        emailError: emailResult.error,
        anexos: anexos.length,
      },
    })

    return NextResponse.json({ ok: true, update, emailStatus: emailResult.status })
  } catch (error) {
    return errorResponse(error)
  }
}
