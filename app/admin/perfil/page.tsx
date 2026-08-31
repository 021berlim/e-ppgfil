import { PageHeader } from '@/components/admin-shell'
import { PerfilForm } from '@/app/admin/perfil/perfil-form'

export const metadata = { title: 'Perfil | e-PPGFIL' }

export default function PerfilPage() {
  return (
    <>
      <PageHeader
        titulo="Perfil"
        descricao="Atualize sua foto, e-mail e senha de acesso ao painel."
      />
      <PerfilForm />
    </>
  )
}
