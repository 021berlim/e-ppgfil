import { PageHeader } from '@/components/admin-shell'
import { PerfilForm } from '@/app/admin/perfil/perfil-form'

export const metadata = { title: 'Perfil | e-PPGFIL' }

export default function PerfilPage() {
  return (
    <>
      <PageHeader
        titulo="Perfil"
        descricao="Gerencie sua identidade visual, e-mail e seguranca de acesso ao painel."
      />
      <PerfilForm />
    </>
  )
}
