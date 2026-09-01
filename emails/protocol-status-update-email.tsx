import { Text } from "@react-email/components";
import {
  ActionBlock,
  Content,
  EmailShell,
  ProcessStepper,
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

  const steps = [
    {
      id: "inicio",
      label: "Início",
      status: currentStatus === "Gerado" ? "Em andamento" : "Concluído",
      date: currentStatus === "Gerado" ? "Registro inicial" : `em ${updatedAt}`,
      isCompleted: currentStatus !== "Gerado",
      isCurrent: currentStatus === "Gerado",
      isPending: false,
    },
    {
      id: "analise",
      label: "Em análise",
      status:
        currentStatus === "Em tramitação"
          ? "Em andamento"
          : currentStatus === "Com exigência"
            ? "Aguardando documento"
            : currentStatus === "Deferido" || currentStatus === "Indeferido"
              ? "Concluído"
              : "Pendente",
      date:
        currentStatus === "Em tramitação" || currentStatus === "Com exigência"
          ? `em ${updatedAt}`
          : currentStatus === "Deferido" || currentStatus === "Indeferido"
            ? `em ${updatedAt}`
            : "Aguardando",
      isCompleted:
        currentStatus === "Deferido" || currentStatus === "Indeferido",
      isCurrent:
        currentStatus === "Em tramitação" || currentStatus === "Com exigência",
      isPending: currentStatus === "Gerado",
    },
    {
      id: "resultado",
      label: currentStatus === "Indeferido" ? "Indeferido" : "Concluído",
      status:
        currentStatus === "Indeferido"
          ? "Não se aplica"
          : currentStatus === "Deferido"
            ? "Concluído"
            : "Pendente",
      date:
        currentStatus === "Indeferido" || currentStatus === "Deferido"
          ? `em ${updatedAt}`
          : "Aguardando",
      isCompleted:
        currentStatus === "Deferido" || currentStatus === "Indeferido",
      isCurrent: currentStatus === "Deferido" || currentStatus === "Indeferido",
      isRejected: currentStatus === "Indeferido",
      isPending:
        currentStatus === "Gerado" ||
        currentStatus === "Em tramitação" ||
        currentStatus === "Com exigência",
    },
  ];

  return (
    <EmailShell
      preview={`Atualizacao do protocolo ${protocolNumber}: ${currentStatus}.`}
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

        <ProcessStepper steps={steps} />

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
