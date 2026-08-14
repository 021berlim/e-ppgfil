import Link from 'next/link'
import { ArrowLeft, Mail } from 'lucide-react'
import { FormCard, PublicShell } from '@/components/public-shell'

export const metadata = {
  title: 'Suporte | e-PPGFIL',
}

export default function SuportePage() {
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
          titulo="Suporte"
          descricao="O atendimento do e-PPGFIL é feito por e-mail pela secretaria do PPGFIL."
        >
          <div className="rounded-2xl border border-border bg-secondary/50 px-5 py-6 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Mail className="size-5" aria-hidden="true" />
            </span>
            <p className="mt-4 text-sm font-semibold text-muted-foreground">
              Escreva para a secretaria
            </p>
            <a
              href="mailto:posfil@gmail.com"
              className="mt-1 inline-block text-lg font-extrabold text-primary underline-offset-4 hover:underline"
            >
              posfil@gmail.com
            </a>
            <div className="mt-5">
              <a
                href="mailto:posfil@gmail.com?subject=Suporte%20e-PPGFIL"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-extrabold text-primary-foreground transition hover:opacity-90"
              >
                <Mail className="size-4" aria-hidden="true" />
                Enviar e-mail
              </a>
            </div>
          </div>

          <div className="mt-6 grid gap-3 text-sm leading-relaxed text-muted-foreground">
            <p className="font-bold text-foreground">Para agilizar o atendimento, informe:</p>
            <ul className="grid gap-2">
              {[
                'Nome completo e CPF do solicitante',
                'Número do protocolo, quando já houver um pedido aberto',
                'Descrição objetiva da dúvida ou do problema encontrado',
              ].map((t) => (
                <li key={t} className="flex gap-2.5">
                  <span
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-2 rounded-xl border border-border bg-card px-4 py-3 text-xs">
              O suporte não abre chamados no sistema. Pedidos formais devem ser registrados em{' '}
              <Link href="/solicitacao" className="font-bold text-primary hover:underline">
                Abrir Solicitação
              </Link>
              .
            </p>
          </div>
        </FormCard>
      </div>
    </PublicShell>
  )
}
