import { Text } from "@react-email/components";
import {
  ActionBlock,
  Content,
  EmailShell,
  InfoPanel,
  InfoRow,
  ProtocolReference,
  textStyle,
} from "./components";

export type ProtocolStatusUpdateEmailProps = {
  requesterName: string;
  protocolNumber: string;
  previousStatus: string;
  currentStatus: string;
  observation: string;
  updatedAt: string;
  consultationUrl: string;
};

function getTrackingMessage(status: string) {
  const normalized = status.trim();

  if (normalized === "Gerado") {
    return "Seu protocolo foi registrado no sistema e já está aguardando a análise inicial da secretaria.";
  }

  if (normalized === "Em tramitação") {
    return "Sua solicitação está sendo analisada pela secretaria e pelo processo administrativo do programa.";
  }

  if (normalized === "Com exigência") {
    return "A secretaria precisa de uma complementação ou esclarecimento para continuar o processamento do seu pedido. Consulte o histórico do protocolo e acompanhe o que precisa ser enviado.";
  }

  if (normalized === "Deferido") {
    return "Seu processo foi deferido. A solicitação foi aprovada e segue conforme o trâmite do programa.";
  }

  if (normalized === "Indeferido") {
    return "Seu processo foi indeferido. A secretaria concluiu o exame e você pode acompanhar o motivo no histórico do protocolo.";
  }

  return "Seu processo está em atualização e a secretaria segue acompanhando o andamento da solicitação.";
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
  const trackingMessage = getTrackingMessage(currentStatus);
  const previousLabel =
    previousStatus && previousStatus !== "—"
      ? previousStatus
      : "Registro inicial";

  return (
    <EmailShell
      preview={`Atualizacao do protocolo ${protocolNumber}: ${currentStatus}.`}
      title="Seu processo está em"
      description={currentStatus}
      reference={protocolNumber}
    >
      <Content>
        <Text style={textStyle}>
          Olá, <strong>{requesterName}</strong>.
        </Text>
        <Text style={textStyle}>
          Acompanhe abaixo a etapa atual do seu processo e o que está
          acontecendo no momento.
        </Text>
        <ProtocolReference number={protocolNumber} status={currentStatus} />

        <InfoPanel title="Rastreio do processo">
          <InfoRow label="Etapa atual" value={currentStatus} />
          <InfoRow label="Etapa anterior" value={previousLabel} />
          <InfoRow label="Última atualização" value={updatedAt} />
        </InfoPanel>

        <Text style={textStyle}>
          <strong>O que está acontecendo:</strong> {trackingMessage}
        </Text>

        <Text style={textStyle}>
          <strong>Detalhamento:</strong>{" "}
          {observation || "Não há observações adicionais."}
        </Text>

        <ActionBlock href={consultationUrl} label="Acompanhar processo" />
      </Content>
    </EmailShell>
  );
}

export default ProtocolStatusUpdateEmail;
