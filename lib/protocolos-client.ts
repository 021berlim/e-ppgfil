import type { Anexo, Protocolo, Status } from './types'

export type CriarProtocoloResponse = {
  protocolo: Protocolo
  receipt: {
    documentFileId: string
    downloadToken: string
    filename: string
  } | null
  emailStatus: 'sent' | 'failed' | 'skipped'
  emailError?: string
}

export async function criarProtocoloRemoto(dados: {
  cpf: string
  nome: string
  email: string
  categoria: string
  tipo: string
  resumo: string
  anexos: Anexo[]
}) {
  const resposta = await fetch('/api/protocolos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  })
  const payload = await resposta.json()
  if (!resposta.ok) {
    throw new Error(payload.error ?? 'Nao foi possivel criar o protocolo.')
  }
  return payload as CriarProtocoloResponse
}

export async function consultarProtocoloRemoto(cpf: string, numero: string) {
  const params = new URLSearchParams({ cpf, numero })
  const resposta = await fetch(`/api/protocolos?${params.toString()}`, { cache: 'no-store' })
  const payload = await resposta.json()
  if (!resposta.ok) {
    throw new Error(payload.error ?? 'Nenhum protocolo encontrado com esse CPF e numero.')
  }
  return payload as Protocolo
}

export async function listarProtocolosRemoto(incluirArquivados: boolean) {
  const params = new URLSearchParams()
  if (incluirArquivados) params.set('incluirArquivados', 'true')
  const resposta = await fetch(`/api/protocolos?${params.toString()}`, { cache: 'no-store' })
  if (!resposta.ok) throw new Error('Nao foi possivel carregar protocolos.')
  return (await resposta.json()) as Protocolo[]
}

export async function moverStatusRemoto(id: string, status: Status, observation?: string) {
  const resposta = await fetch(`/api/protocolos/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, observation }),
  })
  const payload = await resposta.json()
  if (!resposta.ok) {
    throw new Error(payload.error ?? 'Nao foi possivel atualizar o protocolo.')
  }
  window.dispatchEvent(new Event('epfil:protocolos-refresh'))
  return payload
}

export async function gerenciarProtocoloRemoto(
  id: string,
  action: 'assign' | 'note' | 'archive' | 'unarchive' | 'reject_requirement',
  value?: string,
) {
  const resposta = await fetch(`/api/protocolos/${id}/manage`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, value }),
  })
  const payload = await resposta.json()
  if (!resposta.ok) throw new Error(payload.error ?? 'Nao foi possivel atualizar o protocolo.')
  window.dispatchEvent(new Event('epfil:protocolos-refresh'))
  return payload
}

export async function adicionarAndamentoRemoto(input: {
  id: string
  message: string
  anexos: Anexo[]
  origin?: 'secretaria' | 'solicitante'
  authorName?: string
}) {
  const resposta = await fetch(`/api/protocolos/${input.id}/historico`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: input.message,
      anexos: input.anexos,
      origin: input.origin,
      authorName: input.authorName,
    }),
  })
  const payload = await resposta.json()
  if (!resposta.ok) {
    throw new Error(payload.error ?? 'Nao foi possivel registrar o andamento.')
  }
  window.dispatchEvent(new Event('epfil:protocolos-refresh'))
  return payload
}

export async function abrirDocumentoRemoto(documentFileId: string, downloadToken?: string) {
  const params = new URLSearchParams()
  if (downloadToken) params.set('token', downloadToken)
  const resposta = await fetch(`/api/documents/${documentFileId}/download?${params.toString()}`)
  const payload = await resposta.json()
  if (!resposta.ok || !payload.url) {
    throw new Error(payload.error ?? 'Nao foi possivel gerar o link de download.')
  }
  window.open(payload.url, '_blank', 'noopener,noreferrer')
}
