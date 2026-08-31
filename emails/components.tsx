import { Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from '@react-email/components'
import type { ReactNode } from 'react'

const c = { primary: '#6B1E2C', dark: '#48131E', gold: '#B89420', text: '#252220', muted: '#68615C', bg: '#F2F0ED', soft: '#F8F7F5', border: '#D8D3CE' }
const font = 'Arial, Helvetica, sans-serif'

export function EmailShell({ preview, title, description, reference, children }: { preview: string; title: string; description?: string; reference?: string; children: ReactNode }) {
  return <Html lang="pt-BR"><Head /><Preview>{preview}</Preview><Body style={body}>
    <Container style={wrapper}><Text style={preHeader}>Mensagem automática • e-PPGFIL</Text>
      <Container style={container}><Section style={brandBar} /><Section style={header}>
        <Text style={institution}>UERJ • PROGRAMA DE PÓS-GRADUAÇÃO EM FILOSOFIA</Text>
        <Text style={systemName}>e-PPGFIL</Text><Text style={systemDescription}>Sistema Eletrônico de Protocolos</Text>
      </Section><Section style={documentHeader}><Text style={documentType}>COMUNICAÇÃO ELETRÔNICA</Text>
        <Heading style={heading}>{title}</Heading>{description ? <Text style={headingDescription}>{description}</Text> : null}
        {reference ? <Text style={referenceText}>Referência: {reference}</Text> : null}
      </Section>{children}<Section style={securityNotice}><Text style={securityTitle}>Segurança e autenticidade</Text>
        <Text style={securityText}>Esta é uma comunicação automática do e-PPGFIL. Não envie senhas, documentos ou dados pessoais em resposta. Utilize o sistema para acompanhar ou complementar sua solicitação.</Text>
      </Section><Hr style={hr} /><Section style={footerSection}><Text style={footerStrong}>e-PPGFIL • PPGFIL/UERJ</Text>
        <Text style={footer}>Programa de Pós-Graduação em Filosofia da Universidade do Estado do Rio de Janeiro.</Text>
        <Text style={footer}>Mensagem gerada automaticamente. Não responda a este endereço.</Text></Section>
      </Container><Text style={legal}>© {new Date().getFullYear()} PPGFIL/UERJ</Text></Container>
  </Body></Html>
}

export function Content({ children }: { children: ReactNode }) { return <Section style={content}>{children}</Section> }
export function PrimaryButton({ href, children }: { href: string; children: ReactNode }) { return <Button href={href} style={button}>{children}</Button> }
export function ActionBlock({ href, label }: { href: string; label: string }) { return <Section style={actionBlock}><PrimaryButton href={href}>{label}</PrimaryButton><Text style={actionHelp}>Se o botão não funcionar, copie e cole este endereço no navegador:</Text><Link href={href} style={fallbackLink}>{href}</Link></Section> }
export function SecondaryLink({ href, children }: { href: string; children: ReactNode }) { return <Link href={href} style={secondaryLink}>{children}</Link> }

export function ProtocolReference({ number, status }: { number: string; status?: string }) { return <Section style={protocolReference}><Text style={protocolLabel}>NÚMERO DO PROTOCOLO</Text><Text style={protocolNumber}>{number}</Text>{status ? <StatusBadge status={status} /> : null}</Section> }
export function StatusBadge({ status }: { status: string }) {
  const n = status.toLocaleLowerCase('pt-BR')
  const backgroundColor = n.includes('indeferido') ? '#9B2C2C' : n.includes('deferido') ? '#25603B' : n.includes('exigência') ? '#8A5A12' : c.primary
  return <Text style={{ ...statusBadge, backgroundColor }}>SITUAÇÃO: {status.toUpperCase()}</Text>
}
export function InfoPanel({ children, title = 'Dados da solicitação' }: { children: ReactNode; title?: string }) { return <Section style={panel}><Text style={panelTitle}>{title}</Text>{children}</Section> }
export function InfoRow({ label, value }: { label: string; value: ReactNode }) { return <Section style={row}><Text style={rowLabel}>{label}</Text><Text style={rowValue}>{value}</Text></Section> }
export function Notice({ title, children }: { title: string; children: ReactNode }) { return <Section style={notice}><Text style={noticeTitle}>{title}</Text><Text style={noticeText}>{children}</Text></Section> }

export const textStyle = { color: c.text, fontFamily: font, fontSize: '15px', lineHeight: '24px', margin: '0 0 14px' }
export const mutedTextStyle = { ...textStyle, color: c.muted, fontSize: '13px', lineHeight: '20px' }
const body = { backgroundColor: c.bg, margin: 0, padding: '28px 12px', width: '100%' }
const wrapper = { maxWidth: '680px', margin: '0 auto' }
const preHeader = { color: '#77706B', fontFamily: font, fontSize: '11px', margin: '0 0 8px', textAlign: 'right' as const }
const container = { backgroundColor: '#FFF', border: `1px solid ${c.border}`, borderRadius: '4px', overflow: 'hidden', padding: 0, maxWidth: '680px' }
const brandBar = { backgroundColor: c.primary, borderBottom: `5px solid ${c.gold}`, height: '9px' }
const header = { backgroundColor: c.dark, padding: '20px 32px 22px' }
const institution = { color: '#E6D8DB', fontFamily: font, fontSize: '10px', fontWeight: '700', letterSpacing: '1px', lineHeight: '16px', margin: '0 0 12px' }
const systemName = { color: '#FFF', fontFamily: font, fontSize: '24px', fontWeight: '700', lineHeight: '28px', margin: 0 }
const systemDescription = { color: '#D9C7CB', fontFamily: font, fontSize: '12px', lineHeight: '18px', margin: '2px 0 0' }
const documentHeader = { borderBottom: `1px solid ${c.border}`, padding: '24px 32px 22px' }
const documentType = { color: c.gold, fontFamily: font, fontSize: '10px', fontWeight: '700', letterSpacing: '1.3px', margin: '0 0 8px' }
const heading = { color: c.text, fontFamily: font, fontSize: '23px', lineHeight: '30px', margin: 0 }
const headingDescription = { color: c.muted, fontFamily: font, fontSize: '14px', lineHeight: '21px', margin: '7px 0 0' }
const referenceText = { color: c.primary, fontFamily: font, fontSize: '12px', fontWeight: '700', margin: '12px 0 0' }
const content = { padding: '26px 32px 8px' }
const protocolReference = { backgroundColor: '#F4EEEE', borderLeft: `4px solid ${c.primary}`, margin: '18px 0', padding: '16px 18px' }
const protocolLabel = { color: c.muted, fontFamily: font, fontSize: '10px', fontWeight: '700', letterSpacing: '1px', margin: '0 0 5px' }
const protocolNumber = { color: c.dark, fontFamily: 'Courier New, monospace', fontSize: '22px', fontWeight: '700', lineHeight: '28px', margin: '0 0 10px' }
const statusBadge = { borderRadius: '3px', color: '#FFF', display: 'inline-block', fontFamily: font, fontSize: '10px', fontWeight: '700', letterSpacing: '.5px', lineHeight: '16px', margin: 0, padding: '4px 8px' }
const panel = { backgroundColor: c.soft, border: `1px solid ${c.border}`, margin: '18px 0', padding: '0 18px 8px' }
const panelTitle = { borderBottom: `1px solid ${c.border}`, color: c.dark, fontFamily: font, fontSize: '12px', fontWeight: '700', margin: '0 -18px 5px', padding: '12px 18px', textTransform: 'uppercase' as const }
const row = { borderBottom: '1px solid #E7E3DF', margin: 0, padding: '0 0 9px' }
const rowLabel = { color: c.muted, fontFamily: font, fontSize: '10px', fontWeight: '700', letterSpacing: '.4px', lineHeight: '15px', margin: '9px 0 1px', textTransform: 'uppercase' as const }
const rowValue = { color: c.text, fontFamily: font, fontSize: '14px', fontWeight: '600', lineHeight: '20px', margin: 0 }
const notice = { backgroundColor: '#FFF9E8', border: '1px solid #E5D5A1', margin: '18px 0', padding: '13px 15px' }
const noticeTitle = { color: '#69480F', fontFamily: font, fontSize: '12px', fontWeight: '700', margin: '0 0 4px' }
const noticeText = { color: '#55482D', fontFamily: font, fontSize: '13px', lineHeight: '20px', margin: 0 }
const actionBlock = { margin: '22px 0 20px' }
const button = { backgroundColor: c.primary, borderRadius: '4px', color: '#FFF', display: 'inline-block', fontFamily: font, fontSize: '14px', fontWeight: '700', margin: '0 0 12px', padding: '13px 20px', textDecoration: 'none' }
const actionHelp = { color: c.muted, fontFamily: font, fontSize: '11px', lineHeight: '17px', margin: '0 0 2px' }
const fallbackLink = { color: c.primary, fontFamily: font, fontSize: '11px', lineHeight: '17px', overflowWrap: 'anywhere' as const, textDecoration: 'underline' }
const secondaryLink = { border: `1px solid ${c.primary}`, borderRadius: '4px', color: c.primary, display: 'inline-block', fontFamily: font, fontSize: '13px', fontWeight: '700', margin: '0 0 18px', padding: '10px 14px', textDecoration: 'none' }
const securityNotice = { backgroundColor: '#F5F4F2', borderTop: `1px solid ${c.border}`, margin: '20px 0 0', padding: '16px 32px' }
const securityTitle = { color: c.text, fontFamily: font, fontSize: '11px', fontWeight: '700', margin: '0 0 4px' }
const securityText = { color: c.muted, fontFamily: font, fontSize: '11px', lineHeight: '17px', margin: 0 }
const hr = { borderColor: c.border, margin: 0 }
const footerSection = { padding: '18px 32px 22px' }
const footerStrong = { color: c.dark, fontFamily: font, fontSize: '11px', fontWeight: '700', margin: '0 0 4px' }
const footer = { color: c.muted, fontFamily: font, fontSize: '10px', lineHeight: '16px', margin: '0 0 2px' }
const legal = { color: '#7A746F', fontFamily: font, fontSize: '10px', margin: '10px 0 0', textAlign: 'center' as const }
