import { Text } from '@react-email/components'
import {
  ActionBlock,
  Content,
  EmailShell,
  InfoPanel,
  InfoRow,
  Notice,
  ProtocolReference,
  SecondaryLink,
  mutedTextStyle,
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
      title="Recebemos sua solicitação"
      description="Ela foi registrada e já pode ser acompanhada pelo e-PPGFIL."
      reference={protocolNumber}
    >
      <Content>
        <Text style={textStyle}>Olá, <strong>{requesterName}</strong>.</Text>
        <Text style={textStyle}>
          Sua solicitação foi registrada. Guarde o número abaixo para acompanhar o andamento.
        </Text>
        <ProtocolReference number={protocolNumber} status={status} />
        <Notice title="Importante">
          Use este número e o CPF informado no cadastro para consultar a solicitação.
        </Notice>
        <InfoPanel>
          <InfoRow label="Data de abertura" value={createdAt} />
          <InfoRow label="Categoria" value={categoryName} />
          <InfoRow label="Tipo de solicitação" value={requestTypeName} />
        </InfoPanel>
        <Text style={textStyle}>
          <strong>Resumo enviado:</strong> {summary || 'Nenhum detalhamento adicional informado.'}
        </Text>
        {attachmentsSummary.length > 0 ? (
          <Text style={mutedTextStyle}>
            Documentos recebidos: {attachmentsSummary.map((item) => `${item.filename} (${item.sizeLabel})`).join(', ')}.
          </Text>
        ) : (
          <Text style={mutedTextStyle}>Não houve documento anexado na abertura.</Text>
        )}
        {receiptPdfUrl ? (
          <ActionBlock href={receiptPdfUrl} label="Baixar comprovante em PDF" />
        ) : null}
        {receiptAttached ? (
          <Text style={mutedTextStyle}>O comprovante oficial segue anexado a esta mensagem.</Text>
        ) : null}
        {receiptPdfUrl ? <SecondaryLink href={consultationUrl}>Consultar andamento no e-PPGFIL</SecondaryLink> : <ActionBlock href={consultationUrl} label="Consultar andamento" />}
      </Content>
    </EmailShell>
  )
}

export default ProtocolReceiptEmail
