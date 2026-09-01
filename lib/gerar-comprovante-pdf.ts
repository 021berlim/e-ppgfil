'use client'

import { formatarData, formatarTamanho, prazoPrevisto } from './store'
import { obterPrazoDescricaoTipo, obterPrazoSlaTipo } from './categorias'
import type { Protocolo } from './types'

export function mascararCPF(cpf: string): string {
  const digitos = cpf.replace(/\D/g, '').padStart(11, '0').slice(-11)
  return `***.***.${digitos.slice(6, 9)}-${digitos.slice(9)}`
}

function gerarCodigoAutenticacao(id: string, criadoEm: string): string {
  const hashBase = `${id}-${criadoEm}`
  let hash = 0
  for (let i = 0; i < hashBase.length; i++) {
    hash = (hash << 5) - hash + hashBase.charCodeAt(i)
    hash |= 0
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')
  return `AUT-${new Date(criadoEm).getFullYear()}-${hex.slice(0, 4)}-${hex.slice(4, 8)}`
}

export async function baixarComprovantePDF(protocolo: Protocolo) {
  const [{ jsPDF }, QRCodeModule] = await Promise.all([
    import('jspdf'),
    import('qrcode'),
  ])
  const QRCode = (QRCodeModule.default || QRCodeModule) as typeof import('qrcode')

  const urlConsulta = new URL('/consulta', window.location.origin)
  urlConsulta.searchParams.set('protocolo', protocolo.numero)
  const qrCodeDataUrl = await QRCode.toDataURL(urlConsulta.toString(), {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 256,
  })
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })
  const prazoDias = obterPrazoSlaTipo(protocolo.tipo)
  const previsao = prazoPrevisto(protocolo)

  const pageWidth = 210
  const pageHeight = 297
  const margin = 18
  const contentWidth = pageWidth - margin * 2

  // 1. Barra de topo institucional (Bordô PPGFIL)
  doc.setFillColor(107, 30, 44) // #6B1E2C
  doc.rect(0, 0, pageWidth, 7, 'F')

  // Faixa dourada decorativa fina
  doc.setFillColor(201, 162, 39) // #C9A227
  doc.rect(0, 7, pageWidth, 1.5, 'F')

  let cursorY = 17

  // 2. Cabeçalho Institucional
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(107, 30, 44)
  doc.text('UNIVERSIDADE DO ESTADO DO RIO DE JANEIRO — UERJ', margin, cursorY)

  cursorY += 4.5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(80, 80, 80)
  doc.text('CENTRO DE EDUCAÇÃO E HUMANIDADES · INSTITUTO DE FILOSOFIA E CIÊNCIAS HUMANAS', margin, cursorY)

  cursorY += 4
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(60, 60, 60)
  doc.text('PROGRAMA DE PÓS-GRADUAÇÃO EM FILOSOFIA — PPGFIL', margin, cursorY)

  cursorY += 7
  doc.setDrawColor(213, 204, 196) // #D5CCC4
  doc.setLineWidth(0.4)
  doc.line(margin, cursorY, pageWidth - margin, cursorY)

  // 3. Título do Documento
  cursorY += 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(107, 30, 44)
  doc.text('COMPROVANTE OFICIAL DE PROTOCOLO', margin, cursorY)

  cursorY += 4.5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(100, 100, 100)
  doc.text('Sistema Eletrônico de Solicitações e Atendimento da Secretaria — e-PPGFIL', margin, cursorY)

  // 4. Caixa de Destaque do Número de Protocolo
  cursorY += 7
  const bannerHeight = 22
  doc.setFillColor(247, 245, 242) // #F7F5F2
  doc.setDrawColor(107, 30, 44)
  doc.setLineWidth(0.5)
  doc.roundedRect(margin, cursorY, contentWidth, bannerHeight, 3, 3, 'FD')

  // Linha vertical de destaque no banner
  doc.setFillColor(107, 30, 44)
  doc.roundedRect(margin, cursorY, 3.5, bannerHeight, 1.5, 1.5, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(120, 120, 120)
  doc.text('NÚMERO DO PROTOCOLO REGISTRADO', margin + 8, cursorY + 6.5)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(107, 30, 44)
  doc.text(protocolo.numero, margin + 8, cursorY + 14)

  // Informações laterais do banner
  const colunaDirX = margin + contentWidth - 65
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(120, 120, 120)
  doc.text('DATA E HORA DO REGISTRO:', colunaDirX, cursorY + 6.5)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(43, 43, 43)
  doc.text(formatarData(protocolo.criadoEm), colunaDirX, cursorY + 11)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(120, 120, 120)
  doc.text('SITUAÇÃO ATUAL:', colunaDirX, cursorY + 16)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(107, 30, 44)
  doc.text(protocolo.status.toUpperCase(), colunaDirX + 26, cursorY + 16)

  cursorY += bannerHeight + 9

  // 5. Seção de Dados do Solicitante e do Pedido
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(107, 30, 44)
  doc.text('1. DADOS DA SOLICITAÇÃO', margin, cursorY)

  cursorY += 3
  const campos = [
    { rotulo: 'Nome do Solicitante:', valor: protocolo.nome },
    { rotulo: 'CPF:', valor: mascararCPF(protocolo.cpf) },
    { rotulo: 'E-mail:', valor: protocolo.email },
    { rotulo: 'Categoria / Vínculo:', valor: protocolo.categoria },
    { rotulo: 'Tipo de Solicitação:', valor: protocolo.tipo },
    {
      rotulo: 'Previsão de Análise (SLA):',
      valor:
        prazoDias && previsao
          ? `${prazoDias} dias úteis · previsão ${previsao.toLocaleDateString('pt-BR')}`
          : obterPrazoDescricaoTipo(protocolo.tipo) ?? 'Prazo não especificado em fonte oficial',
    },
  ]

  const linhaAltura = 6.8
  const tabelaY = cursorY
  doc.setDrawColor(220, 215, 210)
  doc.setLineWidth(0.3)

  campos.forEach((campo, i) => {
    const yPos = tabelaY + i * linhaAltura
    // Zebrado suave
    if (i % 2 === 0) {
      doc.setFillColor(252, 251, 249)
      doc.rect(margin, yPos, contentWidth, linhaAltura, 'F')
    }
    doc.rect(margin, yPos, contentWidth, linhaAltura, 'S')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(90, 85, 80)
    doc.text(campo.rotulo, margin + 3, yPos + 4.8)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(35, 35, 35)
    doc.text(campo.valor, margin + 48, yPos + 4.8)
  })

  cursorY += campos.length * linhaAltura + 8

  // 6. Resumo da Solicitação
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(107, 30, 44)
  doc.text('2. RESUMO DO PEDIDO', margin, cursorY)

  cursorY += 4
  const textoResumo = protocolo.resumo?.trim() || 'Nenhum detalhamento adicional informado.'
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(50, 50, 50)

  const resumoLinhas = doc.splitTextToSize(textoResumo, contentWidth - 8)
  const resumoBoxHeight = Math.max(14, resumoLinhas.length * 4.5 + 6)

  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(220, 215, 210)
  doc.roundedRect(margin, cursorY, contentWidth, resumoBoxHeight, 2, 2, 'FD')

  doc.text(resumoLinhas, margin + 4, cursorY + 5.5)

  cursorY += resumoBoxHeight + 8

  // 7. Documentos Anexados
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(107, 30, 44)
  doc.text('3. DOCUMENTOS PROTOCOLADOS', margin, cursorY)

  cursorY += 4
  const anexosIniciais = protocolo.historico[0]?.anexos ?? []

  if (anexosIniciais.length === 0) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    doc.text('Nenhum documento anexado na abertura da solicitação.', margin + 2, cursorY + 4)
    cursorY += 9
  } else {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(40, 40, 40)
    anexosIniciais.forEach((anexo, idx) => {
      doc.setFillColor(248, 246, 244)
      doc.roundedRect(margin, cursorY, contentWidth, 6.5, 1.5, 1.5, 'F')
      doc.setFont('helvetica', 'bold')
      doc.text(`• ${anexo.nome}`, margin + 3, cursorY + 4.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(120, 120, 120)
      doc.text(`(${formatarTamanho(anexo.tamanho)})`, margin + contentWidth - 25, cursorY + 4.5)
      doc.setTextColor(40, 40, 40)
      cursorY += 7.5
    })
    cursorY += 2
  }

  // 8. Instruções de Acompanhamento e Autenticidade
  cursorY += 3
  doc.setFillColor(247, 245, 242)
  doc.setDrawColor(213, 204, 196)
  doc.roundedRect(margin, cursorY, contentWidth, 30, 2, 2, 'FD')
  const qrTamanho = 24
  const qrX = pageWidth - margin - qrTamanho - 3
  doc.addImage(qrCodeDataUrl, 'PNG', qrX, cursorY + 3, qrTamanho, qrTamanho)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(107, 30, 44)
  doc.text('COMO ACOMPANHAR SUA SOLICITAÇÃO:', margin + 4, cursorY + 5.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(70, 70, 70)
  doc.text(
    'Escaneie o QR code ou acesse a consulta pública e informe também seu CPF.',
    margin + 4,
    cursorY + 10,
  )
  doc.text(
    'O QR informa somente o protocolo; o CPF não é incluído no endereço.',
    margin + 4,
    cursorY + 14.5,
  )

  doc.setFontSize(6.5)
  doc.setTextColor(100, 100, 100)
  doc.text(
    doc.splitTextToSize(urlConsulta.toString(), contentWidth - qrTamanho - 12),
    margin + 4,
    cursorY + 19,
  )

  const codigoAuth = gerarCodigoAutenticacao(protocolo.id, protocolo.criadoEm)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(100, 100, 100)
  doc.text(`Código de Autenticação Digital: ${codigoAuth}`, margin + 4, cursorY + 26)

  // 9. Rodapé Institucional
  const rodapeY = pageHeight - 12
  doc.setDrawColor(213, 204, 196)
  doc.setLineWidth(0.3)
  doc.line(margin, rodapeY - 3, pageWidth - margin, rodapeY - 3)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(120, 120, 120)
  doc.text('PPGFIL — Programa de Pós-Graduação em Filosofia · UERJ · Contato: posfil@gmail.com', margin, rodapeY + 1)
  doc.text('Documento gerado eletronicamente em conformidade com o regulamento do e-PPGFIL', margin, rodapeY + 4.5)
  doc.text('Página 1 de 1', pageWidth - margin - 16, rodapeY + 1)

  // Salva o PDF no dispositivo do usuário
  const nomeArquivo = `protocolo-${protocolo.numero.replace(/[/\\?%*:|"<>]/g, '-')}.pdf`
  doc.save(nomeArquivo)
}
