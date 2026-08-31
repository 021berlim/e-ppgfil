import { PageHeader } from '@/components/admin-shell'
import { ResearchLinesManager } from '@/app/admin/_components/institutional-crud'

export const metadata = { title: 'Linhas de Pesquisa | e-PPGFIL' }

export default function LinhasPesquisaPage() {
  return (
    <>
      <PageHeader
        titulo="Linhas de Pesquisa"
        descricao="Cadastre e edite as áreas de concentração vigentes do Programa de Pós-Graduação em Filosofia."
      />
      <ResearchLinesManager />
    </>
  )
}
