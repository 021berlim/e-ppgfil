import type { PoolClient } from 'pg'
import { db } from './db'
import { isDocumentAccessTokenValid } from './document-token'
import type { Anexo, Protocolo, Status } from './types'
import { STATUS_LIST } from './types'

export type ProtocolCreateInput = {
  cpf: string
  nome: string
  email: string
  categoria: string
  tipo: string
  categoryId: string
  requestTypeId: string
  resumo: string
  anexos: Anexo[]
}

export type CreatedProtocolResult = {
  protocol: Protocolo
  requesterId: string
  initialHistoryId: string
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, '')
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatAttachmentSummaries(anexos: Anexo[]) {
  return anexos.map((anexo) => ({
    filename: anexo.nome,
    sizeLabel:
      anexo.tamanho < 1024
        ? `${anexo.tamanho} B`
        : anexo.tamanho < 1024 * 1024
          ? `${(anexo.tamanho / 1024).toFixed(0)} KB`
          : `${(anexo.tamanho / (1024 * 1024)).toFixed(1)} MB`,
  }))
}

export function consultationUrl(appBaseUrl: string, protocolNumber: string) {
  const url = new URL('/consulta', appBaseUrl)
  url.searchParams.set('protocolo', protocolNumber)
  return url.toString()
}

export function validateProtocolCreateInput(payload: unknown): ProtocolCreateInput {
  const data = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {}
  const cpf = String(data.cpf ?? '')
  const nome = String(data.nome ?? '').trim()
  const email = String(data.email ?? '').trim().toLowerCase()
  const categoria = String(data.categoria ?? '').trim()
  const tipo = String(data.tipo ?? '').trim()
  const categoryId = String(data.categoryId ?? '').trim()
  const requestTypeId = String(data.requestTypeId ?? '').trim()
  const resumo = String(data.resumo ?? '').trim()
  const anexos = Array.isArray(data.anexos) ? (data.anexos as Anexo[]) : []

  if (digitsOnly(cpf).length !== 11) throw new Error('Informe os 11 digitos do CPF.')
  if (nome.split(/\s+/).length < 2) throw new Error('Informe o nome completo.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Error('Informe um e-mail valido.')
  if (!categoria) throw new Error('Selecione uma categoria.')
  if (!tipo) throw new Error('Selecione o tipo de solicitacao.')
  if (!categoryId || !requestTypeId) throw new Error('Categoria ou tipo de solicitacao sem identificador valido.')

  return { cpf: digitsOnly(cpf), nome, email, categoria, tipo, categoryId, requestTypeId, resumo, anexos }
}

function validateStatus(value: string): Status {
  if (!STATUS_LIST.includes(value as Status)) throw new Error('Status invalido.')
  return value as Status
}

function mapProtocolRow(row: Record<string, any>): Protocolo {
  const historyRows = Array.isArray(row.history) ? row.history : []
  const noteRows = Array.isArray(row.internal_notes) ? row.internal_notes : []
  return {
    id: row.id,
    numero: row.number,
    cpf: row.requester_cpf,
    nome: row.requester_name,
    email: row.requester_email,
    categoria: row.category_name_snapshot,
    tipo: row.request_type_name_snapshot,
    resumo: row.summary ?? '',
    status: row.status,
    subetapaExigencia: row.requirement_substage ?? undefined,
    arquivado: row.archived,
    arquivadoEm: row.archived_at ? new Date(row.archived_at).toISOString() : undefined,
    arquivadoPor: row.archived_by_name ?? undefined,
    criadoEm: new Date(row.created_at).toISOString(),
    atualizadoEm: new Date(row.updated_at).toISOString(),
    responsavel: row.assigned_to_name ?? undefined,
    notasInternas: noteRows.map((note: Record<string, any>) => ({
      id: note.id,
      data: new Date(note.created_at).toISOString(),
      autor: note.author_name,
      mensagem: note.message,
    })),
    historico: historyRows.map((history: Record<string, any>) => ({
      id: history.id,
      data: new Date(history.created_at).toISOString(),
      autor: history.author_name,
      origem: history.origin,
      status: history.status,
      mensagem: history.message,
      anexos: Array.isArray(history.attachments) ? history.attachments : [],
    })),
  }
}

async function queryProtocols(whereSql: string, values: unknown[], includePrivate = false) {
  const result = await db.query(
    `
      SELECT
        p.id,
        p.number,
        p.category_name_snapshot,
        p.request_type_name_snapshot,
        p.summary,
        p.status,
        p.requirement_substage,
        p.archived,
        p.archived_at,
        p.created_at,
        p.updated_at,
        req.cpf AS requester_cpf,
        req.full_name AS requester_name,
        req.email AS requester_email,
        assigned.name AS assigned_to_name,
        archived_user.name AS archived_by_name,
        COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', n.id,
                'created_at', n.created_at,
                'author_name', n.author_name,
                'message', n.message
              ) ORDER BY n.created_at
            )
            FROM public.internal_notes n
            WHERE n.protocol_id = p.id
              ${includePrivate ? '' : 'AND false'}
          ),
          '[]'::jsonb
        ) AS internal_notes,
        COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', h.id,
                'created_at', h.created_at,
                'author_name', h.author_name,
                'origin', h.origin,
                'status', h.status,
                'message', h.message,
                'attachments', COALESCE(
                  (
                    SELECT jsonb_agg(
                      jsonb_build_object(
                        'id', df.id,
                        'nome', df.original_filename,
                        'tipo', df.mime_type,
                        'tamanho', df.size_bytes,
                        'documentFileId', df.id,
                        'status', df.status
                      )
                      ORDER BY df.created_at
                    )
                    FROM public.document_files df
                    WHERE df.protocol_history_id = h.id
                      AND df.status <> 'deleted'
                  ),
                  '[]'::jsonb
                )
              )
              ORDER BY h.created_at
            )
            FROM public.protocol_history h
            WHERE h.protocol_id = p.id
              ${includePrivate ? '' : 'AND h.visible_to_requester = true'}
          ),
          '[]'::jsonb
        ) AS history
      FROM public.protocols p
      JOIN public.requesters req ON req.id = p.requester_id
      LEFT JOIN public.users assigned ON assigned.id = p.assigned_to
      LEFT JOIN public.users archived_user ON archived_user.id = p.archived_by
      ${whereSql}
      ORDER BY p.created_at DESC
    `,
    values,
  )

  return result.rows.map(mapProtocolRow)
}

export async function listProtocols({ includeArchived = false }: { includeArchived?: boolean } = {}) {
  return queryProtocols(includeArchived ? '' : 'WHERE p.archived = false', [], true)
}

export async function getProtocolByPublicLookup(cpf: string, number: string) {
  const protocols = await queryProtocols(
    'WHERE req.cpf = $1 AND upper(p.number) = upper($2) LIMIT 1',
    [digitsOnly(cpf), number.trim()],
  )
  return protocols[0] ?? null
}

export async function getProtocolById(id: string) {
  const protocols = await queryProtocols('WHERE p.id = $1 LIMIT 1', [id], true)
  return protocols[0] ?? null
}

async function assertPendingAttachments(
  client: PoolClient,
  anexos: Anexo[],
) {
  for (const anexo of anexos) {
    if (!anexo.documentFileId || !anexo.downloadToken) {
      throw new Error(`Anexo ${anexo.nome} nao possui identificador de upload valido.`)
    }
    const result = await client.query(
      `
        SELECT id, access_token_hash
        FROM public.document_files
        WHERE id = $1
          AND status = 'available'
          AND protocol_id IS NULL
        LIMIT 1
      `,
      [anexo.documentFileId],
    )
    const file = result.rows[0]
    if (!file || !isDocumentAccessTokenValid(anexo.downloadToken, file.access_token_hash)) {
      throw new Error(`Nao foi possivel validar o anexo ${anexo.nome}.`)
    }
  }
}

export async function createProtocol(input: ProtocolCreateInput): Promise<CreatedProtocolResult> {
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await assertPendingAttachments(client, input.anexos)

    const requesterResult = await client.query(
      `
        INSERT INTO public.requesters (cpf, full_name, email)
        VALUES ($1, $2, $3)
        ON CONFLICT (cpf)
        DO UPDATE SET full_name = EXCLUDED.full_name, email = EXCLUDED.email
        RETURNING id, cpf, full_name, email
      `,
      [input.cpf, input.nome, input.email],
    )
    const requester = requesterResult.rows[0]

    const catalogResult = await client.query(
      `SELECT c.id AS category_id, c.name AS category_name, t.id AS request_type_id, t.name AS request_type_name
       FROM request_categories c JOIN request_types t ON t.category_id=c.id
       WHERE c.is_active=true AND t.is_active=true
         AND (c.id::text=$1 OR c.slug=$1) AND (t.id::text=$2 OR t.slug=$2)
       LIMIT 1`,
      [input.categoryId, input.requestTypeId],
    )
    const catalog = catalogResult.rows[0]
    if (!catalog) throw new Error('Categoria e tipo de solicitacao nao correspondem ao catalogo ativo.')

    const protocolResult = await client.query(
      `
        INSERT INTO public.protocols (
          requester_id,
          category_id,
          request_type_id,
          category_name_snapshot,
          request_type_name_snapshot,
          summary
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, number, category_name_snapshot, request_type_name_snapshot, summary, status, created_at, updated_at
      `,
      [requester.id, catalog.category_id, catalog.request_type_id, catalog.category_name, catalog.request_type_name, input.resumo],
    )
    const protocol = protocolResult.rows[0]

    const historyResult = await client.query(
      `
        INSERT INTO public.protocol_history (
          protocol_id,
          author_name,
          origin,
          status,
          message,
          visible_to_requester
        )
        VALUES ($1, $2, 'solicitante', 'Gerado', $3, true)
        RETURNING id, created_at
      `,
      [
        protocol.id,
        input.nome,
        'Protocolo criado pelo solicitante e registrado na secretaria do PPGFIL.',
      ],
    )
    const history = historyResult.rows[0]

    if (input.anexos.length > 0) {
      await client.query(
        `
          UPDATE public.document_files
          SET protocol_id = $1,
              protocol_history_id = $2,
              owner_requester_id = $3
          WHERE id = ANY($4::uuid[])
        `,
        [protocol.id, history.id, requester.id, input.anexos.map((anexo) => anexo.documentFileId)],
      )
    }

    await client.query('COMMIT')

    return {
      requesterId: requester.id,
      initialHistoryId: history.id,
      protocol: {
        id: protocol.id,
        numero: protocol.number,
        cpf: requester.cpf,
        nome: requester.full_name,
        email: requester.email,
        categoria: protocol.category_name_snapshot,
        tipo: protocol.request_type_name_snapshot,
        resumo: protocol.summary ?? '',
        status: protocol.status,
        criadoEm: new Date(protocol.created_at).toISOString(),
        atualizadoEm: new Date(protocol.updated_at).toISOString(),
        historico: [
          {
            id: history.id,
            data: new Date(history.created_at).toISOString(),
            autor: input.nome,
            origem: 'solicitante',
            status: 'Gerado',
            mensagem: 'Protocolo criado pelo solicitante e registrado na secretaria do PPGFIL.',
            anexos: input.anexos,
          },
        ],
      },
    }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function updateProtocolStatus({
  id,
  status,
  observation,
  authorUserId,
  authorName,
}: {
  id: string
  status: string
  observation?: string
  authorUserId?: string | null
  authorName: string
}) {
  const nextStatus = validateStatus(status)
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const currentResult = await client.query(
      `
        SELECT p.id, p.status, p.number, p.requester_id, req.full_name, req.email
        FROM public.protocols p
        JOIN public.requesters req ON req.id = p.requester_id
        WHERE p.id = $1
        FOR UPDATE
      `,
      [id],
    )
    const current = currentResult.rows[0]
    if (!current) throw new Error('Protocolo nao encontrado.')
    if (current.status === nextStatus) throw new Error('O protocolo ja esta nesta etapa.')

    await client.query(
      `
        UPDATE public.protocols
        SET status = $2,
            requirement_substage = NULL
        WHERE id = $1
      `,
      [id, nextStatus],
    )

    const message = observation?.trim() || `Processo movido para: ${nextStatus}`
    await client.query(
      `
        INSERT INTO public.protocol_history (
          protocol_id,
          author_user_id,
          author_name,
          origin,
          status,
          message,
          visible_to_requester
        )
        VALUES ($1, $2, $3, 'secretaria', $4, $5, true)
      `,
      [id, authorUserId ?? null, authorName, nextStatus, message],
    )

    await client.query('COMMIT')

    return {
      protocolId: id,
      protocolNumber: current.number as string,
      requesterName: current.full_name as string,
      requesterEmail: current.email as string,
      previousStatus: current.status as Status,
      currentStatus: nextStatus,
      observation: message,
      updatedAt: new Date().toISOString(),
    }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function addProtocolHistoryEntry({
  id,
  message,
  anexos,
  authorUserId,
  authorName,
  origin,
}: {
  id: string
  message: string
  anexos: Anexo[]
  authorUserId?: string | null
  authorName: string
  origin: 'secretaria' | 'solicitante'
}) {
  const text = message.trim()
  if (!text) throw new Error('Informe a mensagem do andamento.')

  const client = await db.connect()
  try {
    await client.query('BEGIN')
    if (anexos.length > 0) await assertPendingAttachments(client, anexos)

    const currentResult = await client.query(
      `
        SELECT p.id, p.status, p.number, p.requester_id, req.full_name, req.email
        FROM public.protocols p
        JOIN public.requesters req ON req.id = p.requester_id
        WHERE p.id = $1
        FOR UPDATE
      `,
      [id],
    )
    const current = currentResult.rows[0]
    if (!current) throw new Error('Protocolo nao encontrado.')

    const historyResult = await client.query(
      `
        INSERT INTO public.protocol_history (
          protocol_id,
          author_user_id,
          author_name,
          origin,
          status,
          message,
          visible_to_requester
        )
        VALUES ($1, $2, $3, $4, $5, $6, true)
        RETURNING id
      `,
      [id, authorUserId ?? null, authorName, origin, current.status, text],
    )
    const history = historyResult.rows[0]

    if (anexos.length > 0) {
      await client.query(
        `
          UPDATE public.document_files
          SET protocol_id = $1,
              protocol_history_id = $2,
              owner_requester_id = $3
          WHERE id = ANY($4::uuid[])
        `,
        [id, history.id, current.requester_id, anexos.map((anexo) => anexo.documentFileId)],
      )
    }

    if (origin === 'solicitante' && current.status === 'Com exigência') {
      await client.query(
        `
          UPDATE public.protocols
          SET requirement_substage = 'respondida'
          WHERE id = $1
        `,
        [id],
      )
    }

    await client.query('COMMIT')

    return {
      protocolId: id,
      protocolNumber: current.number as string,
      requesterName: current.full_name as string,
      requesterEmail: current.email as string,
      previousStatus: current.status as Status,
      currentStatus: current.status as Status,
      observation: text,
      updatedAt: new Date().toISOString(),
    }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function manageProtocol({
  id,
  action,
  value,
  authorUserId,
  authorName,
}: {
  id: string
  action: 'assign' | 'note' | 'archive' | 'unarchive' | 'reject_requirement'
  value?: string
  authorUserId: string
  authorName: string
}) {
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const result = await client.query(
      `SELECT id, number, status, requirement_substage, assigned_to, archived
       FROM public.protocols WHERE id = $1 FOR UPDATE`,
      [id],
    )
    const protocol = result.rows[0]
    if (!protocol) throw new Error('Protocolo nao encontrado.')

    let message = ''
    if (action === 'note') {
      const note = value?.trim()
      if (!note) throw new Error('Informe a nota interna.')
      await client.query(
        `INSERT INTO public.internal_notes (protocol_id, author_user_id, author_name, message)
         VALUES ($1, $2, $3, $4)`,
        [id, authorUserId, authorName, note],
      )
      message = 'Nota interna registrada.'
    } else if (action === 'assign') {
      const assigneeId = value?.trim() || null
      if (assigneeId) {
        const assignee = await client.query(
          `SELECT id, name FROM public.users WHERE id = $1 AND is_active = true LIMIT 1`,
          [assigneeId],
        )
        if (!assignee.rows[0]) throw new Error('Responsavel invalido.')
        message = `Responsavel alterado para ${assignee.rows[0].name}.`
      } else {
        message = 'Responsavel removido.'
      }
      await client.query('UPDATE public.protocols SET assigned_to = $2 WHERE id = $1', [id, assigneeId])
    } else if (action === 'archive') {
      if (!['Deferido', 'Indeferido'].includes(protocol.status)) {
        throw new Error('Apenas protocolos finalizados podem ser arquivados.')
      }
      await client.query(
        `UPDATE public.protocols SET archived = true, archived_at = now(), archived_by = $2 WHERE id = $1`,
        [id, authorUserId],
      )
      message = `Protocolo arquivado por ${authorName}.`
    } else if (action === 'unarchive') {
      await client.query(
        `UPDATE public.protocols SET archived = false, archived_at = NULL, archived_by = NULL WHERE id = $1`,
        [id],
      )
      message = `Protocolo desarquivado por ${authorName}.`
    } else {
      const reason = value?.trim()
      if (!reason) throw new Error('Informe o motivo da recusa.')
      if (protocol.status !== 'Com exigência' || protocol.requirement_substage !== 'respondida') {
        throw new Error('Nao ha resposta de exigencia aguardando conferencia.')
      }
      await client.query('UPDATE public.protocols SET requirement_substage = NULL WHERE id = $1', [id])
      message = `Documento recusado ou insuficiente. Motivo: ${reason}`
    }

    if (action !== 'note') {
      await client.query(
        `INSERT INTO public.protocol_history
           (protocol_id, author_user_id, author_name, origin, status, message, visible_to_requester)
         VALUES ($1, $2, $3, 'secretaria', $4, $5, $6)`,
        [id, authorUserId, authorName, protocol.status, message, action !== 'assign'],
      )
    }
    await client.query('COMMIT')
    return { protocolId: id, protocolNumber: protocol.number as string, action, message }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
