import type { Anexo } from '@/lib/types'

type UploadUrlResponse = {
  documentFileId: string
  downloadToken: string
  uploadUrl: string
}

export async function enviarDocumentoR2(file: File): Promise<Anexo> {
  const uploadResponse = await fetch('/api/documents/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
    }),
  })

  const uploadData = (await uploadResponse.json()) as Partial<UploadUrlResponse> & {
    error?: string
  }

  if (!uploadResponse.ok || !uploadData.uploadUrl || !uploadData.documentFileId) {
    throw new Error(uploadData.error ?? 'Nao foi possivel preparar o envio do arquivo.')
  }

  let putResponse: Response
  try {
    putResponse = await fetch(uploadData.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    })
  } catch {
    throw new Error(
      'Falha ao enviar para o Cloudflare R2. Verifique a politica CORS do bucket: a origem do sistema deve estar permitida para PUT com o header Content-Type.',
    )
  }

  if (!putResponse.ok) {
    throw new Error(
      `Nao foi possivel enviar o arquivo para o armazenamento. R2 respondeu HTTP ${putResponse.status}.`,
    )
  }

  const completeResponse = await fetch('/api/documents/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      documentFileId: uploadData.documentFileId,
      downloadToken: uploadData.downloadToken,
    }),
  })

  if (!completeResponse.ok) {
    const data = (await completeResponse.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error ?? 'Arquivo enviado, mas nao foi possivel confirmar o envio.')
  }

  return {
    id: uploadData.documentFileId,
    nome: file.name,
    tipo: file.type || 'application/octet-stream',
    tamanho: file.size,
    documentFileId: uploadData.documentFileId,
    downloadToken: uploadData.downloadToken,
    status: 'available',
  }
}
