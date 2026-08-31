import { headers } from 'next/headers'
import { db } from '@/lib/db'
import type { ClientSession } from '@/lib/auth-types'

type AuditCategory = 'protocolo' | 'autenticacao' | 'sistema' | 'documento'

type AuditActor =
  | { type: 'user'; user: ClientSession | null }
  | { type: 'requester'; requesterId?: string | null; label: string }
  | { type: 'system'; label?: string }

type AuditInput = {
  actor: AuditActor
  category: AuditCategory
  action: string
  protocolId?: string | null
  protocolNumber?: string | null
  documentFileId?: string | null
  details?: Record<string, unknown>
}

function actorFields(actor: AuditActor) {
  if (actor.type === 'user' && actor.user) {
    return {
      actorUserId: actor.user.id ?? null,
      actorRequesterId: null,
      actorLabel: actor.user.name || actor.user.email,
    }
  }

  if (actor.type === 'requester') {
    return {
      actorUserId: null,
      actorRequesterId: actor.requesterId ?? null,
      actorLabel: actor.label,
    }
  }

  return {
    actorUserId: null,
    actorRequesterId: null,
    actorLabel: actor.type === 'system' ? actor.label ?? 'Sistema' : 'Sistema',
  }
}

function requestIp(value: string | undefined) {
  if (!value) return null
  return /^[0-9a-f:.]+$/i.test(value) ? value : null
}

export async function registrarAuditoria(input: AuditInput) {
  const h = await headers()
  const forwardedFor = h.get('x-forwarded-for')?.split(',')[0]?.trim()
  const realIp = h.get('x-real-ip')?.trim()
  const userAgent = h.get('user-agent')
  const { actorUserId, actorRequesterId, actorLabel } = actorFields(input.actor)

  await db.query(
    `
      INSERT INTO public.audit_logs (
        actor_user_id,
        actor_requester_id,
        actor_label,
        category,
        action,
        protocol_id,
        protocol_number,
        document_file_id,
        details,
        ip_address,
        user_agent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::inet, $11)
    `,
    [
      actorUserId,
      actorRequesterId,
      actorLabel,
      input.category,
      input.action,
      input.protocolId ?? null,
      input.protocolNumber ?? null,
      input.documentFileId ?? null,
      JSON.stringify(input.details ?? {}),
      requestIp(forwardedFor ?? realIp ?? undefined),
      userAgent,
    ],
  )
}

function stringifyDetails(details: unknown) {
  if (!details || typeof details !== 'object') return ''
  const entries = Object.entries(details as Record<string, unknown>)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : String(value)}`)
  return entries.join(' | ')
}

export async function listarAuditoria(limite = 1000) {
  const result = await db.query(
    `
      SELECT
        id,
        created_at,
        actor_label,
        category,
        action,
        protocol_number,
        details
      FROM public.audit_logs
      ORDER BY created_at DESC
      LIMIT $1
    `,
    [limite],
  )

  return result.rows.map((row) => ({
    id: row.id,
    data: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    ator: row.actor_label,
    acao: row.action,
    categoria: row.category,
    protocoloNumero: row.protocol_number ?? undefined,
    detalhes: stringifyDetails(row.details),
  }))
}
