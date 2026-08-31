import { PageHeader } from '@/components/admin-shell'
import { AuditoriaLista } from './auditoria-lista'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-server'
import { canViewAuditLogs } from '@/lib/auth-types'

export const metadata = { title: 'Logs de auditoria | e-PPGFIL' }

export default async function AuditoriaPage() {
  const user = await getCurrentUser()
  if (!canViewAuditLogs(user?.role)) redirect('/admin/protocolos')

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
