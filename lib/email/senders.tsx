import { PasswordResetEmail } from "@/emails/password-reset-email";
import { ProtocolReceiptEmail } from "@/emails/protocol-receipt-email";
import { ProtocolStatusUpdateEmail } from "@/emails/protocol-status-update-email";
import { WelcomeEmail } from "@/emails/welcome-email";
import { getEmailFrom, getReplyTo, getResendClient } from "./resend";
import type {
  EmailSendResult,
  PasswordResetEmailData,
  ProtocolReceiptEmailData,
  ProtocolReceiptPdfDelivery,
  ProtocolStatusUpdateEmailData,
  WelcomeEmailData,
} from "./types";

const skippedResult: EmailSendResult = {
  status: "skipped",
  error: "Resend nao configurado.",
};

async function sendReactEmail(input: {
  to: string;
  subject: string;
  react: React.ReactNode;
  attachments?: Array<{ filename: string; content: Buffer }>;
}): Promise<EmailSendResult> {
  try {
    const { data, error } = await getResendClient().emails.send({
      from: getEmailFrom(),
      to: input.to,
      subject: input.subject,
      react: input.react,
      replyTo: getReplyTo(),
      attachments: input.attachments,
    });

    if (error) {
      return { status: "failed", error: error.message };
    }

    return { status: "sent", resendEmailId: data?.id };
  } catch (error) {
    return {
      status: "failed",
      error:
        error instanceof Error
          ? error.message
          : "Erro inesperado ao enviar e-mail.",
    };
  }
}

export function emailSendingConfigured() {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM?.trim(),
  );
}

export async function sendWelcomeEmail(to: string, user: WelcomeEmailData) {
  if (!emailSendingConfigured()) return skippedResult;
  return sendReactEmail({
    to,
    subject: "Bem-vindo ao sistema e-PPGFIL",
    react: <WelcomeEmail {...user} />,
  });
}

export async function sendProtocolReceiptEmail(
  to: string,
  protocolData: ProtocolReceiptEmailData,
  pdf: ProtocolReceiptPdfDelivery,
) {
  if (!emailSendingConfigured()) return skippedResult;
  return sendReactEmail({
    to,
    subject: `Protocolo ${protocolData.protocolNumber} registrado`,
    react: (
      <ProtocolReceiptEmail
        {...protocolData}
        receiptPdfUrl={pdf.mode === "link" ? pdf.url : undefined}
        receiptAttached={pdf.mode === "attachment"}
      />
    ),
    attachments:
      pdf.mode === "attachment"
        ? [{ filename: pdf.filename, content: pdf.content }]
        : undefined,
  });
}

export async function sendProtocolStatusUpdateEmail(
  to: string,
  data: ProtocolStatusUpdateEmailData,
) {
  if (!emailSendingConfigured()) return skippedResult;
  return sendReactEmail({
    to,
    subject: `Atualização do protocolo ${data.protocolNumber}`,
    react: <ProtocolStatusUpdateEmail {...data} />,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  data: PasswordResetEmailData,
) {
  if (!emailSendingConfigured()) return skippedResult;
  return sendReactEmail({
    to,
    subject: "Redefinicao de senha",
    react: <PasswordResetEmail {...data} />,
  });
}
