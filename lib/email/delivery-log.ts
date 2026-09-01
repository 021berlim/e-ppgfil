import { db } from '@/lib/db'
import type { EmailSendResult } from './types'

export async function recordEmailDelivery(input: {
  eventType: 'welcome' | 'protocol_receipt' | 'protocol_generated' | 'protocol_status_update' | 'password_reset'
  recipientEmail: string
  result: EmailSendResult
  protocolId?: string | null
  userId?: string | null
  metadata?: Record<string, unknown>
}) {
  try {
    await db.query(
      `
        INSERT INTO public.email_deliveries (
          event_type,
          recipient_email,
          protocol_id,
          user_id,
          resend_email_id,
          status,
          error_message,
          metadata,
          sent_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6::varchar,
          $7,
          $8::jsonb,
          CASE WHEN $6::varchar = 'sent'::varchar THEN now() ELSE NULL END
        )
      `,
      [
        input.eventType,
        input.recipientEmail,
        input.protocolId ?? null,
        input.userId ?? null,
        input.result.resendEmailId ?? null,
        input.result.status,
        input.result.error ?? null,
        JSON.stringify(input.metadata ?? {}),
      ],
    )
  } catch (error) {
    console.warn('[Email] Nao foi possivel registrar entrega de e-mail:', error)
  }
}
