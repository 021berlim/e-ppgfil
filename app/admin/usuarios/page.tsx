import { PageHeader } from '@/components/admin-shell'
import { UsuariosManager } from '@/app/admin/usuarios/usuarios-manager'

export const metadata = { title: 'Usuários | e-PPGFIL' }

export default function UsuariosPage() {
  return (
    <>
      <PageHeader
        titulo="Usuários"
        descricao="Cadastre usuários do dashboard e atribua cargos de acesso da secretaria e coordenação."
      />
      <UsuariosManager />
    </>
  )
}
