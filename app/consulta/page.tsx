import { ConsultaForm } from './consulta-form'
import { PublicShell } from '@/components/public-shell'

export const metadata = {
  title: 'Consultar Protocolo | e-PPGFIL',
}

export default function ConsultaPage() {
  return (
    <PublicShell>
      <ConsultaForm />
    </PublicShell>
  )
}
