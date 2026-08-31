import { Text } from '@react-email/components'
import {
  ActionBlock,
  Content,
  EmailShell,
  InfoPanel,
  InfoRow,
  ProtocolReference,
  textStyle,
} from './components'

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
      title="Seu protocolo foi atualizado"
      description={`A situação agora é “${currentStatus}”.`}
      reference={protocolNumber}
    >
      <Content>
        <Text style={textStyle}>Olá, <strong>{requesterName}</strong>.</Text>
        <Text style={textStyle}>Há uma nova atualização na sua solicitação.</Text>
        <ProtocolReference number={protocolNumber} status={currentStatus} />
        <InfoPanel title="Dados da movimentação">
          <InfoRow label="Situação anterior" value={previousStatus} />
          <InfoRow label="Nova situação" value={currentStatus} />
          <InfoRow label="Data da movimentação" value={updatedAt} />
        </InfoPanel>
        <Text style={textStyle}>
          <strong>Observação:</strong> {observation || 'Não há observações adicionais.'}
        </Text>
        <ActionBlock href={consultationUrl} label="Consultar protocolo" />
      </Content>
    </EmailShell>
  )
}

export default ProtocolStatusUpdateEmail
