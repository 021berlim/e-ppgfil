import { Section, Text } from '@react-email/components'
import {
  EmailShell,
  InfoRow,
  PrimaryButton,
  mutedTextStyle,
  panelStyle,
  textStyle,
} from './components'

export type ProtocolReceiptEmailProps = {
  requesterName: string
  protocolNumber: string
  createdAt: string
  categoryName: string
  requestTypeName: string
  summary: string
  status: string
  consultationUrl: string
  receiptPdfUrl?: string
  receiptAttached?: boolean
  attachmentsSummary: Array<{ filename: string; sizeLabel: string }>
}

export function ProtocolReceiptEmail({
  requesterName,
  protocolNumber,
  createdAt,
  categoryName,
  requestTypeName,
  summary,
  status,
  consultationUrl,
  receiptPdfUrl,
  receiptAttached,
  attachmentsSummary,
}: ProtocolReceiptEmailProps) {
  return (
    <EmailShell
      preview={`Protocolo ${protocolNumber} registrado no e-PPGFIL.`}
      title="Protocolo registrado"
    >
      <Section style={{ padding: '8px 28px 0' }}>
        <Text style={textStyle}>Ola, {requesterName}.</Text>
        <Text style={textStyle}>
          Sua solicitacao foi registrada com sucesso. Guarde o numero abaixo para
          acompanhar o andamento.
        </Text>
        <Section style={panelStyle}>
          <InfoRow label="Numero do protocolo" value={protocolNumber} />
          <InfoRow label="Data de abertura" value={createdAt} />
          <InfoRow label="Categoria" value={categoryName} />
          <InfoRow label="Tipo de solicitacao" value={requestTypeName} />
          <InfoRow label="Situacao inicial" value={status} />
        </Section>
        <Text style={textStyle}>
          <strong>Resumo enviado:</strong> {summary || 'Nenhum detalhamento adicional informado.'}
        </Text>
        {attachmentsSummary.length > 0 ? (
          <Text style={mutedTextStyle}>
            Documentos informados: {attachmentsSummary.map((item) => `${item.filename} (${item.sizeLabel})`).join(', ')}.
          </Text>
        ) : (
          <Text style={mutedTextStyle}>Nenhum documento foi anexado na abertura.</Text>
        )}
        {receiptPdfUrl ? (
          <PrimaryButton href={receiptPdfUrl}>Baixar comprovante em PDF</PrimaryButton>
        ) : null}
        {receiptAttached ? (
          <Text style={mutedTextStyle}>O comprovante oficial tambem segue anexado a este e-mail.</Text>
        ) : null}
        <Text style={mutedTextStyle}>
          Para consultar o andamento, acesse: {consultationUrl}
        </Text>
      </Section>
    </EmailShell>
  )
}

export default ProtocolReceiptEmail
