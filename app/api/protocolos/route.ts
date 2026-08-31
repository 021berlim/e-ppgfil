import { NextResponse } from 'next/server'
import { registrarAuditoria } from '@/lib/audit-server'
import { getCurrentUser } from '@/lib/auth-server'
import { recordEmailDelivery } from '@/lib/email/delivery-log'
import { sendProtocolReceiptEmail } from '@/lib/email/senders'
import {
  consultationUrl,
  createProtocol,
  formatAttachmentSummaries,
  formatDateTime,
  getProtocolByPublicLookup,
  listProtocols,
  validateProtocolCreateInput,
} from '@/lib/protocols-server'
import { generateProtocolReceiptPdfBuffer, safeProtocolFilename } from '@/lib/protocol-receipt-pdf'
import { storeProtocolReceiptPdf } from '@/lib/protocol-receipt-storage'

export const runtime = 'nodejs'

function errorResponse(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : 'Erro inesperado.'
  return NextResponse.json({ error: message }, { status })
}

function appBaseUrl(request: Request) {
  return process.env.APP_BASE_URL || new URL(request.url).origin
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cpf = searchParams.get('cpf')
    const numero = searchParams.get('numero')

    if (cpf && numero) {
      const protocolo = await getProtocolByPublicLookup(cpf, numero)
      if (!protocolo) return NextResponse.json({ error: 'Protocolo nao encontrado.' }, { status: 404 })
      return NextResponse.json(protocolo)
    }

    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })

    const incluirArquivados = searchParams.get('incluirArquivados') === 'true'
    const protocolos = await listProtocols({ includeArchived: incluirArquivados })
    return NextResponse.json(protocolos)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request) {
  let created: Awaited<ReturnType<typeof createProtocol>> | null = null
  let receiptDocument: Awaited<ReturnType<typeof storeProtocolReceiptPdf>> | null = null
  try {
    const payload = validateProtocolCreateInput(await request.json())
    created = await createProtocol(payload)
    const baseUrl = appBaseUrl(request)
    const pdfBuffer = await generateProtocolReceiptPdfBuffer({
      protocol: created.protocol,
      appBaseUrl: baseUrl,
    })

    const deliveryMode = process.env.PROTOCOL_RECEIPT_DELIVERY_MODE === 'attachment'
      ? 'attachment'
      : 'link'

    let pdfDelivery:
      | { mode: 'link'; url: string }
      | { mode: 'attachment'; filename: string; content: Buffer }

    if (deliveryMode === 'attachment') {
      pdfDelivery = {
        mode: 'attachment',
        filename: safeProtocolFilename(created.protocol.numero),
        content: pdfBuffer,
      }
    } else {
      receiptDocument = await storeProtocolReceiptPdf({
        protocolId: created.protocol.id,
        requesterId: created.requesterId,
        protocolNumber: created.protocol.numero,
        pdfBuffer,
      })
      pdfDelivery = {
        mode: 'link',
        url: new URL(
          `/api/documents/${receiptDocument.documentFileId}/download?token=${encodeURIComponent(receiptDocument.downloadToken)}`,
          baseUrl,
        ).toString(),
      }
    }

    const emailResult = await sendProtocolReceiptEmail(created.protocol.email, {
      requesterName: created.protocol.nome,
      protocolNumber: created.protocol.numero,
      createdAt: formatDateTime(created.protocol.criadoEm),
      categoryName: created.protocol.categoria,
      requestTypeName: created.protocol.tipo,
      summary: created.protocol.resumo,
      status: created.protocol.status,
      consultationUrl: consultationUrl(baseUrl, created.protocol.numero),
      attachmentsSummary: formatAttachmentSummaries(payload.anexos),
    }, pdfDelivery)

    await recordEmailDelivery({
      eventType: 'protocol_receipt',
      recipientEmail: created.protocol.email,
      protocolId: created.protocol.id,
      result: emailResult,
      metadata: {
        protocolNumber: created.protocol.numero,
        deliveryMode,
        receiptDocumentId: receiptDocument?.documentFileId,
      },
    })

    await registrarAuditoria({
      actor: {
        type: 'requester',
        requesterId: created.requesterId,
        label: created.protocol.nome,
      },
      category: 'protocolo',
      action: 'protocolo_criado',
      protocolId: created.protocol.id,
      protocolNumber: created.protocol.numero,
      documentFileId: receiptDocument?.documentFileId,
      details: {
        emailStatus: emailResult.status,
        emailError: emailResult.error,
        receiptDeliveryMode: deliveryMode,
      },
    })

    return NextResponse.json({
      protocolo: created.protocol,
      receipt: receiptDocument
        ? {
            documentFileId: receiptDocument.documentFileId,
            downloadToken: receiptDocument.downloadToken,
            filename: receiptDocument.filename,
          }
        : null,
      emailStatus: emailResult.status,
      emailError: emailResult.error,
    }, { status: 201 })
  } catch (error) {
    if (created) {
      const message = error instanceof Error ? error.message : 'Erro inesperado.'
      await registrarAuditoria({
        actor: { type: 'requester', requesterId: created.requesterId, label: created.protocol.nome },
        category: 'protocolo',
        action: 'protocolo_criado_email_comprovante_falhou',
        protocolId: created.protocol.id,
        protocolNumber: created.protocol.numero,
        details: { error: message },
      }).catch(() => undefined)
      await recordEmailDelivery({
        eventType: 'protocol_receipt',
        recipientEmail: created.protocol.email,
        protocolId: created.protocol.id,
        result: { status: 'failed', error: message },
      })
      return NextResponse.json({
        protocolo: created.protocol,
        receipt: null,
        emailStatus: 'failed',
        emailError: message,
      }, { status: 201 })
    }
    return errorResponse(error)
  }
}
