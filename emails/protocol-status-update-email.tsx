import { Section, Text } from '@react-email/components'
import { EmailShell, InfoRow, PrimaryButton, panelStyle, textStyle } from './components'

export type ProtocolStatusUpdateEmailProps = {
  requesterName: string
  protocolNumber: string
  previousStatus: string
  currentStatus: string
  observation: string
  updatedAt: string
  consultationUrl: string
}

export function ProtocolStatusUpdateEmail({
  requesterName,
  protocolNumber,
  previousStatus,
  currentStatus,
  observation,
  updatedAt,
  consultationUrl,
}: ProtocolStatusUpdateEmailProps) {
  return (
    <EmailShell
      preview={`Atualizacao do protocolo ${protocolNumber}: ${currentStatus}.`}
      title="Atualizacao de protocolo"
    >
      <Section style={{ padding: '8px 28px 0' }}>
        <Text style={textStyle}>Ola, {requesterName}.</Text>
        <Text style={textStyle}>Houve uma atualizacao no andamento da sua solicitacao.</Text>
        <Section style={panelStyle}>
          <InfoRow label="Numero do protocolo" value={protocolNumber} />
          <InfoRow label="Etapa anterior" value={previousStatus} />
          <InfoRow label="Nova etapa" value={currentStatus} />
          <InfoRow label="Atualizado em" value={updatedAt} />
        </Section>
        <Text style={textStyle}>
          <strong>Parecer/observacoes:</strong> {observation || 'Sem observacoes adicionais.'}
        </Text>
        <PrimaryButton href={consultationUrl}>Acompanhar protocolo</PrimaryButton>
      </Section>
    </EmailShell>
  )
}

export default ProtocolStatusUpdateEmail
