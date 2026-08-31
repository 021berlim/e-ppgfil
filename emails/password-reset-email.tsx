import { Section, Text } from '@react-email/components'
import { EmailShell, PrimaryButton, mutedTextStyle, textStyle } from './components'

export type PasswordResetEmailProps = {
  userName: string
  resetUrl: string
  expiresAt: string
}

export function PasswordResetEmail({ userName, resetUrl, expiresAt }: PasswordResetEmailProps) {
  return (
    <EmailShell
      preview="Use o link temporario para redefinir sua senha no e-PPGFIL."
      title="Redefinicao de senha"
    >
      <Section style={{ padding: '8px 28px 0' }}>
        <Text style={textStyle}>Ola, {userName}.</Text>
        <Text style={textStyle}>
          Recebemos uma solicitacao para redefinir sua senha de acesso ao painel do e-PPGFIL.
        </Text>
        <PrimaryButton href={resetUrl}>Redefinir senha</PrimaryButton>
        <Text style={mutedTextStyle}>Este link expira em {expiresAt}.</Text>
        <Text style={mutedTextStyle}>
          Se voce nao solicitou esta recuperacao, ignore este e-mail.
        </Text>
      </Section>
    </EmailShell>
  )
}

export default PasswordResetEmail
