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
    return "Recebemos seu protocolo! Ele já está registrado e em fila para a primeira análise da secretaria.";
  }

  if (normalized === "Em tramitação") {
    return "Seu pedido está em andamento. A secretaria e a equipe do programa estão analisando os detalhes.";
  }

  if (normalized === "Com exigência") {
    return "Precisamos de mais informações para dar sequencia ao seu pedido. Por favor, verifique o histórico do protocolo para enviar os ajustes necessários.";
  }

  if (normalized === "Deferido") {
    return "Boas notícias: sua solicitação foi aprovada! O processo segue o fluxo normal do programa.";
  }

  if (normalized === "Indeferido") {
    return "Sua solicitação não foi aprovada. Disponibilizamos o motivo detalhado no histórico do seu protocolo.";
  }

  return "Estamos atualizando o status da sua solicitação. Por favor, tente novamente em breve.";
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
