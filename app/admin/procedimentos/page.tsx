import { PageHeader } from '@/components/admin-shell'
import { ProceduresManager } from '@/app/admin/_components/institutional-crud'

export const metadata = { title: 'Procedimentos Internos | e-PPGFIL' }

export default function ProcedimentosPage() {
  return (
    <>
      <PageHeader
        titulo="Procedimentos Internos"
        descricao="Cadastre e edite fluxos padronizados da secretaria para tramitação das solicitações."
      />
      <ProceduresManager />
    </>
  )
}
