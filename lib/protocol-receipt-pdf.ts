import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import defaultCategories from '@/data/categorias-solicitacoes.json'
import type { Protocolo } from './types'

type CategoryItem = {
  id: string
  nome: string
  tiposSolicitacao: Array<{
    id: string
    nome: string
    prazoDias?: number
    prazoDescricao?: string
  }>
}

function getSlaInfo(typeNameOrId: string) {
  const normalized = typeNameOrId.trim().toLowerCase()
  for (const cat of defaultCategories as CategoryItem[]) {
    for (const t of cat.tiposSolicitacao || []) {
      if (
        t.id.toLowerCase() === normalized ||
        t.nome.toLowerCase() === normalized
      ) {
        return {
          prazoDias: t.prazoDias,
          prazoDescricao: t.prazoDescricao,
        }
      }
    }
  }
  return { prazoDias: undefined, prazoDescricao: undefined }
}

export function maskCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '').padStart(11, '0').slice(-11)
  return `***.***.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export function safeProtocolFilename(protocolNumber: string) {
  return `protocolo-${protocolNumber.replace(/[/\\?%*:|"<>]/g, '-')}.pdf`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function addBusinessDays(base: Date, days: number): Date {
  const d = new Date(base)
  let remaining = days
  while (remaining > 0) {
    d.setDate(d.getDate() + 1)
    const weekday = d.getDay()
    if (weekday !== 0 && weekday !== 6) remaining--
  }
  return d
}

function predictedDate(protocol: Protocolo): Date | null {
  const { prazoDias } = getSlaInfo(protocol.tipo)
  return prazoDias ? addBusinessDays(new Date(protocol.criadoEm), prazoDias) : null
}

function authCode(id: string, createdAt: string): string {
  const hashBase = `${id}-${createdAt}`
  let hash = 0
  for (let i = 0; i < hashBase.length; i++) {
    hash = (hash << 5) - hash + hashBase.charCodeAt(i)
    hash |= 0
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')
  return `AUT-${new Date(createdAt).getFullYear()}-${hex.slice(0, 4)}-${hex.slice(4, 8)}`
}

export async function generateProtocolReceiptPdfArrayBuffer({
  protocol,
  appBaseUrl,
}: {
  protocol: Protocolo
  appBaseUrl: string
}) {
  const consultationUrl = new URL('/consulta', appBaseUrl)
  consultationUrl.searchParams.set('protocolo', protocol.numero)
  const qrCodeDataUrl = await QRCode.toDataURL(consultationUrl.toString(), {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 256,
  })

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const slaDays = obterPrazoSlaTipo(protocol.tipo)
  const forecast = predictedDate(protocol)
  const pageWidth = 210
  const pageHeight = 297
  const margin = 18
  const contentWidth = pageWidth - margin * 2

  doc.setFillColor(107, 30, 44)
  doc.rect(0, 0, pageWidth, 7, 'F')
  doc.setFillColor(201, 162, 39)
  doc.rect(0, 7, pageWidth, 1.5, 'F')

  let cursorY = 17

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(107, 30, 44)
  doc.text('UNIVERSIDADE DO ESTADO DO RIO DE JANEIRO - UERJ', margin, cursorY)

  cursorY += 4.5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(80, 80, 80)
  doc.text('CENTRO DE EDUCACAO E HUMANIDADES - INSTITUTO DE FILOSOFIA E CIENCIAS HUMANAS', margin, cursorY)

  cursorY += 4
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(60, 60, 60)
  doc.text('PROGRAMA DE POS-GRADUACAO EM FILOSOFIA - PPGFIL', margin, cursorY)

  cursorY += 7
  doc.setDrawColor(213, 204, 196)
  doc.setLineWidth(0.4)
  doc.line(margin, cursorY, pageWidth - margin, cursorY)

  cursorY += 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(107, 30, 44)
  doc.text('COMPROVANTE OFICIAL DE PROTOCOLO', margin, cursorY)

  cursorY += 4.5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(100, 100, 100)
  doc.text('Sistema Eletronico de Solicitacoes e Atendimento da Secretaria - e-PPGFIL', margin, cursorY)

  cursorY += 7
  const bannerHeight = 22
  doc.setFillColor(247, 245, 242)
  doc.setDrawColor(107, 30, 44)
  doc.setLineWidth(0.5)
  doc.roundedRect(margin, cursorY, contentWidth, bannerHeight, 3, 3, 'FD')
  doc.setFillColor(107, 30, 44)
  doc.roundedRect(margin, cursorY, 3.5, bannerHeight, 1.5, 1.5, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(120, 120, 120)
  doc.text('NUMERO DO PROTOCOLO REGISTRADO', margin + 8, cursorY + 6.5)
  doc.setFontSize(16)
  doc.setTextColor(107, 30, 44)
  doc.text(protocol.numero, margin + 8, cursorY + 14)

  const rightColumnX = margin + contentWidth - 65
  doc.setFontSize(7.5)
  doc.setTextColor(120, 120, 120)
  doc.text('DATA E HORA DO REGISTRO:', rightColumnX, cursorY + 6.5)
  doc.setFontSize(8.5)
  doc.setTextColor(43, 43, 43)
  doc.text(formatDate(protocol.criadoEm), rightColumnX, cursorY + 11)
  doc.setFontSize(7.5)
  doc.setTextColor(120, 120, 120)
  doc.text('SITUACAO ATUAL:', rightColumnX, cursorY + 16)
  doc.setFontSize(8.5)
  doc.setTextColor(107, 30, 44)
  doc.text(protocol.status.toUpperCase(), rightColumnX + 26, cursorY + 16)

  cursorY += bannerHeight + 9
  doc.setFontSize(10)
  doc.setTextColor(107, 30, 44)
  doc.text('1. DADOS DA SOLICITACAO', margin, cursorY)

  cursorY += 3
  const fields = [
    { label: 'Nome do Solicitante:', value: protocol.nome },
    { label: 'CPF:', value: maskCpf(protocol.cpf) },
    { label: 'E-mail:', value: protocol.email },
    { label: 'Categoria / Vinculo:', value: protocol.categoria },
    { label: 'Tipo de Solicitacao:', value: protocol.tipo },
    {
      label: 'Previsao de Analise (SLA):',
      value:
        slaDays && forecast
          ? `${slaDays} dias uteis - previsao ${forecast.toLocaleDateString('pt-BR')}`
          : obterPrazoDescricaoTipo(protocol.tipo) ?? 'Prazo nao especificado em fonte oficial',
    },
  ]

  const rowHeight = 6.8
  const tableY = cursorY
  doc.setDrawColor(220, 215, 210)
  doc.setLineWidth(0.3)

  fields.forEach((field, index) => {
    const y = tableY + index * rowHeight
    if (index % 2 === 0) {
      doc.setFillColor(252, 251, 249)
      doc.rect(margin, y, contentWidth, rowHeight, 'F')
    }
    doc.rect(margin, y, contentWidth, rowHeight, 'S')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(90, 85, 80)
    doc.text(field.label, margin + 3, y + 4.8)
    doc.setFontSize(8.5)
    doc.setTextColor(35, 35, 35)
    doc.text(String(field.value), margin + 48, y + 4.8)
  })

  cursorY += fields.length * rowHeight + 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(107, 30, 44)
  doc.text('2. RESUMO DO PEDIDO', margin, cursorY)

  cursorY += 4
  const summaryText = protocol.resumo?.trim() || 'Nenhum detalhamento adicional informado.'
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(50, 50, 50)
  const summaryLines = doc.splitTextToSize(summaryText, contentWidth - 8)
  const summaryBoxHeight = Math.max(14, summaryLines.length * 4.5 + 6)
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(220, 215, 210)
  doc.roundedRect(margin, cursorY, contentWidth, summaryBoxHeight, 2, 2, 'FD')
  doc.text(summaryLines, margin + 4, cursorY + 5.5)

  cursorY += summaryBoxHeight + 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(107, 30, 44)
  doc.text('3. DOCUMENTOS PROTOCOLADOS', margin, cursorY)

  cursorY += 4
  const initialAttachments = protocol.historico[0]?.anexos ?? []
  if (initialAttachments.length === 0) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    doc.text('Nenhum documento anexado na abertura da solicitacao.', margin + 2, cursorY + 4)
    cursorY += 9
  } else {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(40, 40, 40)
    initialAttachments.forEach((attachment) => {
      doc.setFillColor(248, 246, 244)
      doc.roundedRect(margin, cursorY, contentWidth, 6.5, 1.5, 1.5, 'F')
      doc.setFont('helvetica', 'bold')
      doc.text(`- ${attachment.nome}`, margin + 3, cursorY + 4.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(120, 120, 120)
      doc.text(`(${formatSize(attachment.tamanho)})`, margin + contentWidth - 25, cursorY + 4.5)
      doc.setTextColor(40, 40, 40)
      cursorY += 7.5
    })
    cursorY += 2
  }

  cursorY += 3
  doc.setFillColor(247, 245, 242)
  doc.setDrawColor(213, 204, 196)
  doc.roundedRect(margin, cursorY, contentWidth, 30, 2, 2, 'FD')
  const qrSize = 24
  const qrX = pageWidth - margin - qrSize - 3
  doc.addImage(qrCodeDataUrl, 'PNG', qrX, cursorY + 3, qrSize, qrSize)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(107, 30, 44)
  doc.text('COMO ACOMPANHAR SUA SOLICITACAO:', margin + 4, cursorY + 5.5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(70, 70, 70)
  doc.text('Escaneie o QR code ou acesse a consulta publica e informe tambem seu CPF.', margin + 4, cursorY + 10)
  doc.text('O QR informa somente o protocolo; o CPF nao e incluido no endereco.', margin + 4, cursorY + 14.5)
  doc.setFontSize(6.5)
  doc.setTextColor(100, 100, 100)
  doc.text(doc.splitTextToSize(consultationUrl.toString(), contentWidth - qrSize - 12), margin + 4, cursorY + 19)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(100, 100, 100)
  doc.text(`Codigo de Autenticacao Digital: ${authCode(protocol.id, protocol.criadoEm)}`, margin + 4, cursorY + 26)

  const footerY = pageHeight - 12
  doc.setDrawColor(213, 204, 196)
  doc.setLineWidth(0.3)
  doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(120, 120, 120)
  doc.text('PPGFIL - Programa de Pos-Graduacao em Filosofia - UERJ - Contato: posfil@gmail.com', margin, footerY + 1)
  doc.text('Documento gerado eletronicamente em conformidade com o regulamento do e-PPGFIL', margin, footerY + 4.5)
  doc.text('Pagina 1 de 1', pageWidth - margin - 16, footerY + 1)

  return doc.output('arraybuffer')
}

export async function generateProtocolReceiptPdfBuffer(input: {
  protocol: Protocolo
  appBaseUrl: string
}) {
  const arrayBuffer = await generateProtocolReceiptPdfArrayBuffer(input)
  return Buffer.from(arrayBuffer)
}
