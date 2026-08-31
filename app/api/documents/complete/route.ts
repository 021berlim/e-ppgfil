import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'
import { db } from '@/lib/db'
import { isDocumentAccessTokenValid } from '@/lib/document-token'
import { headR2Object } from '@/lib/r2'

export const runtime = 'nodejs'

function errorResponse(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : 'Erro inesperado.'
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    const payload = await request.json()
    const documentFileId = String(payload.documentFileId ?? '')
    const downloadToken = typeof payload.downloadToken === 'string' ? payload.downloadToken : null

    const result = await db.query(
      `
        SELECT id, r2_key, access_token_hash
        FROM public.document_files
        WHERE id = $1
          AND status = 'pending_upload'
        LIMIT 1
      `,
      [documentFileId],
    )

    const file = result.rows[0]
    if (!file) return NextResponse.json({ error: 'Documento nao encontrado.' }, { status: 404 })

    const tokenOk = isDocumentAccessTokenValid(downloadToken, file.access_token_hash)
    if (!user && !tokenOk) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    await headR2Object(file.r2_key)
    await db.query(`UPDATE public.document_files SET status = 'available' WHERE id = $1`, [
      documentFileId,
    ])

    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}
