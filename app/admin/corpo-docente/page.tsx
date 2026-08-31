import { PageHeader } from '@/components/admin-shell'
import { FacultyMembersManager } from '@/app/admin/_components/institutional-crud'

export const metadata = { title: 'Corpo Docente | e-PPGFIL' }

export default function CorpoDocentePage() {
  return (
    <>
      <PageHeader
        titulo="Corpo Docente"
        descricao="Cadastre e edite docentes, cargos, formação, links e vínculos com linhas de pesquisa."
      />
      <FacultyMembersManager />
    </>
  )
}
