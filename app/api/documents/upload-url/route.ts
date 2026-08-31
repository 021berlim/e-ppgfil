import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'
import { db } from '@/lib/db'
import { createDocumentAccessToken, hashDocumentAccessToken } from '@/lib/document-token'
import { createPresignedUploadUrl, getR2Bucket } from '@/lib/r2'

export const runtime = 'nodejs'

const MAX_UPLOAD_BYTES = Number(process.env.R2_MAX_UPLOAD_BYTES ?? 25 * 1024 * 1024)
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
])

function errorResponse(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : 'Erro inesperado.'
  return NextResponse.json({ error: message }, { status })
}

function extensionFor(contentType: string, filename: string) {
  const fromName = filename.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (fromName && fromName.length <= 8) return fromName
  if (contentType === 'application/pdf') return 'pdf'
  if (contentType === 'image/jpeg') return 'jpg'
  if (contentType === 'image/png') return 'png'
  if (contentType === 'application/msword') return 'doc'
  return 'docx'
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    const payload = await request.json()
    const filename = String(payload.filename ?? '').trim()
    const contentType = String(payload.contentType ?? '').trim()
    const sizeBytes = Number(payload.sizeBytes)

    if (!filename) throw new Error('Nome do arquivo ausente.')
    if (!ALLOWED_TYPES.has(contentType)) {
      throw new Error('Formato nao permitido. Envie PDF, DOC, DOCX, JPG ou PNG.')
    }
    if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_UPLOAD_BYTES) {
      throw new Error('Arquivo ausente ou acima do limite permitido.')
    }

    const documentFileId = randomUUID()
    const downloadToken = createDocumentAccessToken()
    const key = `uploads/${new Date().getFullYear()}/${documentFileId}.${extensionFor(
      contentType,
      filename,
    )}`

    await db.query(
      `
        INSERT INTO public.document_files (
          id,
          uploaded_by_user_id,
          r2_bucket,
          r2_key,
          original_filename,
          mime_type,
          size_bytes,
          access_token_hash,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending_upload')
      `,
      [
        documentFileId,
        user?.id ?? null,
        getR2Bucket(),
        key,
        filename,
        contentType,
        sizeBytes,
        hashDocumentAccessToken(downloadToken),
      ],
    )

    const uploadUrl = await createPresignedUploadUrl({
      key,
      contentType,
      expiresIn: Number(process.env.R2_PRESIGNED_UPLOAD_TTL_SECONDS ?? 300),
    })

    return NextResponse.json({
      documentFileId,
      downloadToken,
      uploadUrl,
      expiresIn: Number(process.env.R2_PRESIGNED_UPLOAD_TTL_SECONDS ?? 300),
    })
  } catch (error) {
    return errorResponse(error)
  }
}
