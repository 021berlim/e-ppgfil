import { Section, Text } from '@react-email/components'
import { EmailShell, PrimaryButton, mutedTextStyle, textStyle } from './components'

export type WelcomeEmailProps = {
  userName: string
  loginUrl: string
}

export function WelcomeEmail({ userName, loginUrl }: WelcomeEmailProps) {
  return (
    <EmailShell
      preview="Sua conta administrativa no e-PPGFIL foi criada."
      title="Bem-vindo ao e-PPGFIL"
    >
      <Section style={{ padding: '8px 28px 0' }}>
        <Text style={textStyle}>Ola, {userName}.</Text>
        <Text style={textStyle}>
          Sua conta administrativa foi criada no e-PPGFIL. Voce ja pode acessar o
          painel com as credenciais cadastradas pela administracao.
        </Text>
        <PrimaryButton href={loginUrl}>Acessar painel</PrimaryButton>
        <Text style={mutedTextStyle}>
          Este fluxo nao exige validacao ou ativacao de conta por e-mail.
        </Text>
      </Section>
    </EmailShell>
  )
}

export default WelcomeEmail
