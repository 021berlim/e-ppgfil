import { PageHeader } from '@/components/admin-shell'
import { ResearchLinesManager } from '@/app/admin/_components/institutional-crud'
import { getCurrentUser } from '@/lib/auth-server'
import { canManageAdministrativeCatalogs } from '@/lib/auth-types'

export const metadata = { title: 'Linhas de Pesquisa | e-PPGFIL' }

export default async function LinhasPesquisaPage() {
  const user = await getCurrentUser()
  const canManage = canManageAdministrativeCatalogs(user?.role)

  return (
    <>
      <PageHeader
        titulo="Linhas de Pesquisa"
        descricao={
          canManage
            ? 'Cadastre e edite as áreas de concentração vigentes do Programa de Pós-Graduação em Filosofia.'
            : 'Consulte as áreas de concentração vigentes do Programa de Pós-Graduação em Filosofia.'
        }
      />
      <ResearchLinesManager />
    </>
  )
}
