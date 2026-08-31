import { Text } from '@react-email/components'
import { ActionBlock, Content, EmailShell, Notice, mutedTextStyle, textStyle } from './components'

export type PasswordResetEmailProps = {
  userName: string
  resetUrl: string
  expiresAt: string
}

export function PasswordResetEmail({ userName, resetUrl, expiresAt }: PasswordResetEmailProps) {
  return (
    <EmailShell
      preview="Use o link temporário para redefinir sua senha no e-PPGFIL."
      title="Redefinição de credencial"
      description="Solicitação de recuperação de acesso ao painel administrativo."
    >
      <Content>
        <Text style={textStyle}>Olá, <strong>{userName}</strong>.</Text>
        <Text style={textStyle}>
          Recebemos uma solicitação para redefinir sua senha de acesso ao e-PPGFIL.
        </Text>
        <Notice title="Link temporário">Este acesso é individual e expira em {expiresAt}. Não encaminhe esta mensagem.</Notice>
        <ActionBlock href={resetUrl} label="Redefinir minha senha" />
        <Text style={mutedTextStyle}>Se você não fez esta solicitação, ignore a mensagem. Sua senha atual permanecerá válida.</Text>
      </Content>
    </EmailShell>
  )
}

export default PasswordResetEmail
