import { randomUUID } from 'crypto'
import { db } from './db'
import { createDocumentAccessToken, hashDocumentAccessToken } from './document-token'
import { getR2Bucket, putR2Object } from './r2'
import { safeProtocolFilename } from './protocol-receipt-pdf'

export async function storeProtocolReceiptPdf({
  protocolId,
  requesterId,
  protocolNumber,
  pdfBuffer,
}: {
  protocolId: string
  requesterId: string
  protocolNumber: string
  pdfBuffer: Buffer
}) {
  const documentFileId = randomUUID()
  const downloadToken = createDocumentAccessToken()
  const year = new Date().getFullYear()
  const filename = safeProtocolFilename(protocolNumber)
  const key = `protocol-receipts/${year}/${protocolId}/${filename}`

  await putR2Object({
    key,
    body: pdfBuffer,
    contentType: 'application/pdf',
  })

  await db.query(
    `
      INSERT INTO public.document_files (
        id,
        protocol_id,
        owner_requester_id,
        r2_bucket,
        r2_key,
        original_filename,
        mime_type,
        size_bytes,
        access_token_hash,
        status,
        is_public
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'application/pdf', $7, $8, 'available', false)
    `,
    [
      documentFileId,
      protocolId,
      requesterId,
      getR2Bucket(),
      key,
      filename,
      pdfBuffer.byteLength,
      hashDocumentAccessToken(downloadToken),
    ],
  )

  return {
    documentFileId,
    downloadToken,
    filename,
    sizeBytes: pdfBuffer.byteLength,
  }
}
