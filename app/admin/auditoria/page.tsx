import { PageHeader } from '@/components/admin-shell'
import { AuditoriaLista } from './auditoria-lista'

export const metadata = { title: 'Logs de auditoria | e-PPGFIL' }

export default function AuditoriaPage() {
  return (
    <>
      <PageHeader
        titulo="Logs de auditoria"
        descricao="Consulte quem realizou cada alteração administrativa no sistema."
      />
      <AuditoriaLista />
    </>
  )
}
