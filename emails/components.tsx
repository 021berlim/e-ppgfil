import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { ReactNode } from 'react'

const colors = {
  primary: '#6B1E2C',
  gold: '#C9A227',
  text: '#2B2B2B',
  muted: '#69635F',
  bg: '#F7F5F2',
  border: '#D5CCC4',
}

export function EmailShell({
  preview,
  title,
  children,
}: {
  preview: string
  title: string
  children: ReactNode
}) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={topBar} />
          <Section style={header}>
            <Text style={eyebrow}>e-PPGFIL · PPGFIL/UERJ</Text>
            <Heading style={heading}>{title}</Heading>
          </Section>
          {children}
          <Hr style={hr} />
          <Text style={footer}>
            Programa de Pos-Graduacao em Filosofia da UERJ. Este e-mail foi enviado
            automaticamente pelo sistema e-PPGFIL.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export function PrimaryButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Button href={href} style={button}>
      {children}
    </Button>
  )
}

export function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Section style={row}>
      <Text style={rowLabel}>{label}</Text>
      <Text style={rowValue}>{value}</Text>
    </Section>
  )
}

export const textStyle = {
  color: colors.text,
  fontFamily: 'Arial, sans-serif',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 14px',
}

export const mutedTextStyle = {
  ...textStyle,
  color: colors.muted,
  fontSize: '13px',
  lineHeight: '20px',
}

export const panelStyle = {
  backgroundColor: colors.bg,
  border: `1px solid ${colors.border}`,
  borderRadius: '8px',
  padding: '16px',
  margin: '18px 0',
}

const body = {
  backgroundColor: '#EFEAE5',
  margin: 0,
  padding: '24px 12px',
}

const container = {
  backgroundColor: '#FFFFFF',
  border: `1px solid ${colors.border}`,
  borderRadius: '8px',
  overflow: 'hidden',
  padding: 0,
  maxWidth: '620px',
}

const topBar = {
  backgroundColor: colors.primary,
  borderBottom: `4px solid ${colors.gold}`,
  height: '12px',
}

const header = {
  padding: '24px 28px 8px',
}

const eyebrow = {
  color: colors.gold,
  fontFamily: 'Arial, sans-serif',
  fontSize: '12px',
  fontWeight: '700',
  letterSpacing: '0',
  margin: '0 0 8px',
  textTransform: 'uppercase' as const,
}

const heading = {
  color: colors.primary,
  fontFamily: 'Arial, sans-serif',
  fontSize: '24px',
  lineHeight: '32px',
  margin: 0,
}

const button = {
  backgroundColor: colors.primary,
  borderRadius: '8px',
  color: '#FFFFFF',
  display: 'inline-block',
  fontFamily: 'Arial, sans-serif',
  fontSize: '14px',
  fontWeight: '700',
  margin: '8px 0 18px',
  padding: '12px 18px',
  textDecoration: 'none',
}

const hr = {
  borderColor: colors.border,
  margin: '22px 28px 14px',
}

const footer = {
  ...mutedTextStyle,
  padding: '0 28px 24px',
}

const row = {
  margin: '0 0 10px',
}

const rowLabel = {
  color: colors.muted,
  fontFamily: 'Arial, sans-serif',
  fontSize: '12px',
  fontWeight: '700',
  lineHeight: '16px',
  margin: '0 0 2px',
  textTransform: 'uppercase' as const,
}

const rowValue = {
  color: colors.text,
  fontFamily: 'Arial, sans-serif',
  fontSize: '15px',
  fontWeight: '700',
  lineHeight: '22px',
  margin: 0,
}
