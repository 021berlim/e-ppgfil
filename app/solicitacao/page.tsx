import { SolicitacaoForm } from './solicitacao-form'
import { PublicShell } from '@/components/public-shell'

export const metadata = {
  title: 'Abrir Solicitação | e-PPGFIL',
}

export default function SolicitacaoPage() {
  return (
    <PublicShell>
      <SolicitacaoForm />
    </PublicShell>
  )
}
