import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'
import { registrarAuditoria } from '@/lib/audit-server'
import { db } from '@/lib/db'
import { isDocumentAccessTokenValid } from '@/lib/document-token'
import { createPresignedDownloadUrl } from '@/lib/r2'

export const runtime = 'nodejs'

function errorResponse(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : 'Erro inesperado.'
  return NextResponse.json({ error: message }, { status })
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser()
    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    const result = await db.query(
      `
        SELECT
          id,
          protocol_id,
          r2_key,
          original_filename,
          access_token_hash
        FROM public.document_files
        WHERE id = $1
          AND status = 'available'
        LIMIT 1
      `,
      [id],
    )

    const file = result.rows[0]
    if (!file) return NextResponse.json({ error: 'Documento nao encontrado.' }, { status: 404 })

    const tokenOk = isDocumentAccessTokenValid(token, file.access_token_hash)
    if (!user && !tokenOk) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    const url = await createPresignedDownloadUrl(
      file.r2_key,
      Number(process.env.R2_PRESIGNED_DOWNLOAD_TTL_SECONDS ?? 300),
    )

    await db.query(
      `
        INSERT INTO public.document_access_logs (
          document_file_id,
          protocol_id,
          user_id,
          action
        )
        VALUES ($1, $2, $3, 'signed_url')
      `,
      [file.id, file.protocol_id ?? null, user?.id ?? null],
    )

    await registrarAuditoria({
      actor: user ? { type: 'user', user } : { type: 'requester', label: 'Solicitante externo' },
      category: 'documento',
      action: 'documento_download_autorizado',
      protocolId: file.protocol_id ?? null,
      documentFileId: file.id,
      details: { filename: file.original_filename },
    })

    return NextResponse.json({
      url,
      filename: file.original_filename,
      expiresIn: Number(process.env.R2_PRESIGNED_DOWNLOAD_TTL_SECONDS ?? 300),
    })
  } catch (error) {
    return errorResponse(error)
  }
}
