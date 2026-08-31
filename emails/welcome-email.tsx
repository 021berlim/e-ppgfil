import { Text } from '@react-email/components'
import { ActionBlock, Content, EmailShell, InfoPanel, InfoRow, mutedTextStyle, textStyle } from './components'

export type WelcomeEmailProps = {
  userName: string
  loginUrl: string
}

export function WelcomeEmail({ userName, loginUrl }: WelcomeEmailProps) {
  return (
    <EmailShell
      preview="Sua conta administrativa no e-PPGFIL foi criada."
      title="Seu acesso foi criado"
      description="Você já pode entrar no painel administrativo do e-PPGFIL."
    >
      <Content>
        <Text style={textStyle}>Olá, <strong>{userName}</strong>.</Text>
        <Text style={textStyle}>
          Sua conta foi cadastrada. Use as credenciais definidas pela administração para entrar.
        </Text>
        <InfoPanel title="Dados do acesso"><InfoRow label="Sistema" value="e-PPGFIL" /><InfoRow label="Perfil" value="Usuário administrativo" /></InfoPanel>
        <ActionBlock href={loginUrl} label="Acessar painel administrativo" />
        <Text style={mutedTextStyle}>O acesso não exige ativação por e-mail. Em caso de dúvida, procure a administração do PPGFIL.</Text>
      </Content>
    </EmailShell>
  )
}

export default WelcomeEmail
