import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { FormCard, PublicShell } from '@/components/public-shell'
import { FaqLista } from './faq-lista'

export const metadata = {
  title: 'Dúvidas frequentes | e-PPGFIL',
}

export default function FaqPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar ao início
        </Link>

        <FormCard
          titulo="Dúvidas frequentes"
          descricao="Respostas rápidas sobre a abertura e o acompanhamento de solicitações no PPGFIL."
        >
          <FaqLista />

          <p className="mt-6 rounded-xl border border-border bg-secondary/60 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
            Não encontrou o que procurava? Fale com a secretaria pela tela de{' '}
            <Link href="/suporte" className="font-bold text-primary hover:underline">
              Suporte
            </Link>
            .
          </p>
        </FormCard>
      </div>
    </PublicShell>
  )
}
