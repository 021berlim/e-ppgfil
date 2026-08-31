import { PageHeader } from '@/components/admin-shell'
import { InstitutionalFormsManager } from '@/app/admin/_components/institutional-crud'

export const metadata = { title: 'Documentos | e-PPGFIL' }

export default function DocumentosPage() {
  return (
    <>
      <PageHeader
        titulo="Documentos"
        descricao="Cadastre e edite formulários e documentos oficiais do PPGFIL disponíveis para consulta."
      />
      <InstitutionalFormsManager />
    </>
  )
}
