import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

const c = {
  primary: "#6B1E2C",
  dark: "#48131E",
  gold: "#B89420",
  text: "#252220",
  muted: "#68615C",
  bg: "#F2F0ED",
  soft: "#F8F7F5",
  border: "#D8D3CE",
};
const font = "Arial, Helvetica, sans-serif";
const logoUrl = `${(process.env.APP_BASE_URL || "https://e-ppgfil.vercel.app").replace(/\/$/, "")}/logo-ppgfil-email.png`;

export function EmailShell({
  preview,
  title,
  description,
  reference,
  children,
}: {
  preview: string;
  title?: string;
  description?: string;
  reference?: string;
  children: ReactNode;
}) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={wrapper}>
          <Container style={container}>
            <Section style={header}>
              <Row>
                <Column style={logoColumn}>
                  <Img
                    src={logoUrl}
                    width="160"
                    height="64"
                    alt="PPGFIL UERJ — Pós-graduação em Filosofia"
                    style={logo}
                  />
                </Column>
                <Column style={bannerTextColumn}>
                  <Text style={bannerTitle}>e-PPGFIL</Text>
                  <Text style={bannerSubtitle}>
                    Programa de Pós-Graduação em Filosofia - UERJ
                  </Text>
                </Column>
              </Row>
            </Section>
            {title || description || reference ? (
              <Section style={documentHeader}>
                {title ? <Heading style={heading}>{title}</Heading> : null}
                {description ? (
                  <Text style={headingDescription}>{description}</Text>
                ) : null}
                {reference ? (
                  <Text style={referenceText}>Referência: {reference}</Text>
                ) : null}
              </Section>
            ) : null}
            {children}
            <Hr style={hr} />
            <Section style={footerSection}>
              <Text style={footerStrong}>e-PPGFIL</Text>
              <Text style={footer}>
                Programa de Pós-Graduação em Filosofia da Universidade do Estado
                do Rio de Janeiro.
              </Text>
              <Text style={footer}>
                Em caso de dúvida, responda a esta mensagem para falar com a
                secretaria.
              </Text>
            </Section>
            <Text style={legal}>© {new Date().getFullYear()} PPGFIL/UERJ</Text>
          </Container>
        </Container>
      </Body>
    </Html>
  );
}

export function Content({ children }: { children: ReactNode }) {
  return <Section style={content}>{children}</Section>;
}
export function PrimaryButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Button href={href} style={button}>
      {children}
    </Button>
  );
}
export function ActionBlock({ href, label }: { href: string; label: string }) {
  return (
    <Section style={actionBlock}>
      <PrimaryButton href={href}>{label}</PrimaryButton>
    </Section>
  );
}
export function SecondaryLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} style={secondaryLink}>
      {children}
    </Link>
  );
}

export function ProtocolReference({
  number,
  status,
}: {
  number: string;
  status?: string;
}) {
  return (
    <Section style={protocolReference}>
      <Text style={protocolLabel}>NÚMERO DO PROTOCOLO</Text>
      <Text style={protocolNumber}>{number}</Text>
      {status ? <StatusBadge status={status} /> : null}
    </Section>
  );
}
export function StatusBadge({ status }: { status: string }) {
  const n = status.toLocaleLowerCase("pt-BR");
  const backgroundColor = n.includes("indeferido")
    ? "#9B2C2C"
    : n.includes("deferido")
      ? "#25603B"
      : n.includes("exigência")
        ? "#8A5A12"
        : c.primary;
  return (
    <Text style={{ ...statusBadge, backgroundColor }}>
      SITUAÇÃO: {status.toUpperCase()}
    </Text>
  );
}
export function InfoPanel({
  children,
  title = "Dados da solicitação",
}: {
  children: ReactNode;
  title?: string;
}) {
  return (
    <Section style={panel}>
      <Text style={panelTitle}>{title}</Text>
      {children}
    </Section>
  );
}
export function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Section style={row}>
      <Text style={rowLabel}>{label}</Text>
      <Text style={rowValue}>{value}</Text>
    </Section>
  );
}
export function Notice({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Section style={notice}>
      <Text style={noticeTitle}>{title}</Text>
      <Text style={noticeText}>{children}</Text>
    </Section>
  );
}

export type ProcessStep = {
  id: string;
  label: string;
  status: string;
  date?: string;
  isCompleted?: boolean;
  isCurrent?: boolean;
  isPending?: boolean;
  isRejected?: boolean;
};

export function ProcessStepper({ steps }: { steps: ProcessStep[] }) {
  return (
    <Section style={stepperSection}>
      <Text style={panelTitle}>Rastreio do processo</Text>
      <table
        role="presentation"
        cellPadding={0}
        cellSpacing={0}
        border={0}
        width="100%"
        style={stepperTable}
      >
        <tr>
          {steps.map((step, index) => {
            const isCompleted = Boolean(step.isCompleted);
            const isCurrent = Boolean(step.isCurrent);
            const isPending = Boolean(step.isPending);
            const isRejected = Boolean(step.isRejected);

            const circleColor = isRejected
              ? "#C0392B"
              : isCompleted
                ? "#22C55E"
                : isCurrent
                  ? c.primary
                  : "#9AA0A6";

            const iconLabel = isRejected
              ? "×"
              : isCompleted
                ? "✓"
                : isPending
                  ? "-"
                  : "•";
            const connectorStyle = {
              ...stepConnector,
              background: isCompleted || isCurrent ? c.primary : "#DADADA",
              opacity: index === steps.length - 1 ? 0 : 1,
            };

            return (
              <>
                <td valign="top" style={stepCell} key={`${step.id}-cell`}>
                  <table
                    role="presentation"
                    cellPadding={0}
                    cellSpacing={0}
                    border={0}
                    width="100%"
                  >
                    <tr>
                      <td align="center" style={stepNodeCell}>
                        <div
                          style={{
                            ...stepNode,
                            backgroundColor: isCompleted
                              ? "#22C55E"
                              : isRejected
                                ? "#C0392B"
                                : isCurrent
                                  ? "#FFFFFF"
                                  : "#F3F4F6",
                            borderColor: circleColor,
                            boxShadow: isCurrent
                              ? `0 0 0 4px ${"rgba(107,30,44,0.12)"}`
                              : isCompleted
                                ? "0 0 0 3px rgba(34, 197, 94, 0.14)"
                                : "none",
                          }}
                        >
                          <Text
                            style={{
                              ...stepIcon,
                              color:
                                isCompleted || isRejected || isCurrent
                                  ? isCompleted || isRejected
                                    ? "#FFFFFF"
                                    : c.primary
                                  : "#6B7280",
                              fontWeight: isCurrent ? "700" : "600",
                            }}
                          >
                            {iconLabel}
                          </Text>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style={stepLabelCell}>
                        <Text
                          style={{
                            ...stepTitle,
                            color: isCurrent ? c.primary : c.text,
                            fontWeight: isCurrent ? "700" : "600",
                          }}
                        >
                          {step.label}
                        </Text>
                        <Text
                          style={{
                            ...stepStatus,
                            color: isRejected
                              ? "#B42318"
                              : isCompleted
                                ? "#22C55E"
                                : isCurrent
                                  ? c.primary
                                  : "#4B5563",
                          }}
                        >
                          {step.status}
                        </Text>
                        {step.date ? (
                          <Text style={stepDate}>{step.date}</Text>
                        ) : null}
                      </td>
                    </tr>
                  </table>
                </td>
                {index < steps.length - 1 ? (
                  <td
                    valign="middle"
                    style={connectorCell}
                    key={`${step.id}-connector`}
                  >
                    <div style={connectorStyle} />
                  </td>
                ) : null}
              </>
            );
          })}
        </tr>
      </table>
    </Section>
  );
}

export const textStyle = {
  color: c.text,
  fontFamily: font,
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 14px",
};
export const mutedTextStyle = {
  ...textStyle,
  color: c.muted,
  fontSize: "13px",
  lineHeight: "20px",
};
const body = {
  backgroundColor: "#F6F7F8",
  margin: 0,
  padding: "32px 12px",
  width: "100%",
};
const wrapper = { maxWidth: "680px", margin: "0 auto" };
const container = {
  backgroundColor: "#FFF",
  border: `1px solid ${c.border}`,
  borderRadius: "6px",
  overflow: "hidden",
  padding: 0,
  maxWidth: "680px",
};
const header = {
  backgroundColor: "#F7F5F3",
  borderBottom: `1px solid ${c.border}`,
  padding: "20px 32px 18px",
};
const logoColumn = { width: "34%", verticalAlign: "middle" as const };
const logo = {
  display: "block",
  height: "64px",
  margin: 0,
  objectFit: "contain" as const,
  width: "160px",
};
const bannerTextColumn = {
  paddingLeft: "12px",
  verticalAlign: "middle" as const,
};
const bannerTitle = {
  color: c.dark,
  fontFamily: font,
  fontSize: "22px",
  fontWeight: "700",
  letterSpacing: ".3px",
  lineHeight: "26px",
  margin: "0 0 2px",
  textAlign: "left" as const,
};
const bannerSubtitle = {
  color: c.muted,
  fontFamily: font,
  fontSize: "12px",
  lineHeight: "18px",
  margin: 0,
  textAlign: "left" as const,
};
const documentHeader = {
  borderBottom: `1px solid ${c.border}`,
  padding: "18px 38px 10px",
};
const heading = {
  color: c.text,
  fontFamily: font,
  fontSize: "23px",
  lineHeight: "30px",
  margin: 0,
};
const headingDescription = {
  color: c.muted,
  fontFamily: font,
  fontSize: "14px",
  lineHeight: "21px",
  margin: "7px 0 0",
};
const referenceText = {
  color: c.primary,
  fontFamily: font,
  fontSize: "12px",
  fontWeight: "700",
  margin: "12px 0 0",
};
const content = { padding: "26px 38px 8px" };
const protocolReference = {
  backgroundColor: "#FAF9F8",
  border: `1px solid ${c.border}`,
  borderLeft: `4px solid ${c.primary}`,
  borderRadius: "4px",
  margin: "18px 0",
  padding: "16px 18px",
};
const protocolLabel = {
  color: c.muted,
  fontFamily: font,
  fontSize: "10px",
  fontWeight: "700",
  letterSpacing: "1px",
  margin: "0 0 5px",
};
const protocolNumber = {
  color: c.dark,
  fontFamily: "Courier New, monospace",
  fontSize: "22px",
  fontWeight: "700",
  lineHeight: "28px",
  margin: "0 0 10px",
};
const statusBadge = {
  borderRadius: "3px",
  color: "#FFF",
  display: "inline-block",
  fontFamily: font,
  fontSize: "10px",
  fontWeight: "700",
  letterSpacing: ".5px",
  lineHeight: "16px",
  margin: 0,
  padding: "4px 8px",
};
const panel = {
  backgroundColor: "#FFF",
  border: `1px solid ${c.border}`,
  borderRadius: "4px",
  margin: "18px 0",
  padding: "0 18px 8px",
};
const panelTitle = {
  borderBottom: `1px solid ${c.border}`,
  color: c.dark,
  fontFamily: font,
  fontSize: "12px",
  fontWeight: "700",
  margin: "0 -18px 5px",
  padding: "12px 18px",
  textTransform: "uppercase" as const,
};
const stepperSection = {
  backgroundColor: "#FFF",
  border: `1px solid ${c.border}`,
  borderRadius: "4px",
  margin: "18px 0",
  padding: "0 18px 16px",
};
const stepperTable = {
  borderCollapse: "collapse" as const,
  width: "100%",
};
const stepCell = {
  width: "33.33%",
  verticalAlign: "top" as const,
};
const stepNodeCell = {
  padding: "14px 0 8px",
  textAlign: "center" as const,
};
const stepNode = {
  backgroundColor: "#F3F4F6",
  border: "2px solid #9AA0A6",
  borderRadius: "50%",
  display: "inline-block",
  height: "28px",
  lineHeight: "26px",
  textAlign: "center" as const,
  width: "28px",
};
const stepIcon = {
  color: "#6B7280",
  fontFamily: font,
  fontSize: "14px",
  lineHeight: "20px",
  margin: 0,
};
const stepLabelCell = {
  padding: "0 4px",
  textAlign: "center" as const,
};
const stepTitle = {
  color: c.text,
  fontFamily: font,
  fontSize: "11px",
  lineHeight: "16px",
  margin: "0 0 2px",
  textTransform: "uppercase" as const,
};
const stepStatus = {
  color: "#4B5563",
  fontFamily: font,
  fontSize: "10px",
  fontWeight: "700",
  lineHeight: "14px",
  margin: "0 0 3px",
  textTransform: "uppercase" as const,
};
const stepDate = {
  color: c.muted,
  fontFamily: font,
  fontSize: "9px",
  lineHeight: "13px",
  margin: 0,
};
const connectorCell = {
  width: "18px",
  padding: "0 0 18px",
  verticalAlign: "middle" as const,
};
const stepConnector = {
  borderRadius: "999px",
  height: "3px",
  width: "100%",
  minWidth: "18px",
};
const row = {
  borderBottom: "1px solid #E7E3DF",
  margin: 0,
  padding: "0 0 9px",
};
const rowLabel = {
  color: c.muted,
  fontFamily: font,
  fontSize: "10px",
  fontWeight: "700",
  letterSpacing: ".4px",
  lineHeight: "15px",
  margin: "9px 0 1px",
  textTransform: "uppercase" as const,
};
const rowValue = {
  color: c.text,
  fontFamily: font,
  fontSize: "14px",
  fontWeight: "600",
  lineHeight: "20px",
  margin: 0,
};
const notice = {
  backgroundColor: "#FFF9E8",
  border: "1px solid #E5D5A1",
  borderRadius: "4px",
  margin: "18px 0",
  padding: "13px 15px",
};
const noticeTitle = {
  color: "#69480F",
  fontFamily: font,
  fontSize: "12px",
  fontWeight: "700",
  margin: "0 0 4px",
};
const noticeText = {
  color: "#55482D",
  fontFamily: font,
  fontSize: "13px",
  lineHeight: "20px",
  margin: 0,
};
const actionBlock = { margin: "22px 0 20px" };
const button = {
  backgroundColor: c.primary,
  borderRadius: "5px",
  color: "#FFF",
  display: "inline-block",
  fontFamily: font,
  fontSize: "14px",
  fontWeight: "700",
  margin: "0 0 12px",
  padding: "13px 22px",
  textDecoration: "none",
};
const actionHelp = {
  color: c.muted,
  fontFamily: font,
  fontSize: "11px",
  lineHeight: "17px",
  margin: "0 0 2px",
};
const fallbackLink = {
  color: c.primary,
  fontFamily: font,
  fontSize: "11px",
  lineHeight: "17px",
  overflowWrap: "anywhere" as const,
  textDecoration: "underline",
};
const secondaryLink = {
  border: `1px solid ${c.primary}`,
  borderRadius: "4px",
  color: c.primary,
  display: "inline-block",
  fontFamily: font,
  fontSize: "13px",
  fontWeight: "700",
  margin: "0 0 18px",
  padding: "10px 14px",
  textDecoration: "none",
};
const hr = { borderColor: c.border, margin: 0 };
const footerSection = {
  padding: "18px 38px 24px",
  textAlign: "center" as const,
};
const footerStrong = {
  color: c.dark,
  fontFamily: font,
  fontSize: "11px",
  fontWeight: "700",
  margin: "0 0 4px",
};
const footer = {
  color: c.muted,
  fontFamily: font,
  fontSize: "10px",
  lineHeight: "16px",
  margin: "0 0 2px",
};
const legal = {
  color: "#7A746F",
  fontFamily: font,
  fontSize: "10px",
  margin: "10px 0 0",
  textAlign: "center" as const,
};
