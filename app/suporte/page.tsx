import Link from 'next/link'
import { ArrowLeft, Clock, Mail, MapPin, Phone } from 'lucide-react'
import { FormCard, PublicShell } from '@/components/public-shell'
import { CONTATO_PPGFIL } from '@/lib/conteudo-institucional'

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
              href={`mailto:${CONTATO_PPGFIL.email}`}
              className="mt-1 inline-block text-lg font-extrabold text-primary underline-offset-4 hover:underline"
            >
              {CONTATO_PPGFIL.email}
            </a>
            <div className="mt-5">
              <a
                href={`mailto:${CONTATO_PPGFIL.email}?subject=Suporte%20e-PPGFIL`}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-extrabold text-primary-foreground transition hover:opacity-90"
              >
                <Mail className="size-4" aria-hidden="true" />
                Enviar e-mail
              </a>
            </div>
          </div>

          <div className="mt-5 grid gap-3 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
            <p className="flex gap-3"><Phone className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /><span>{CONTATO_PPGFIL.telefone}</span></p>
            <p className="flex gap-3"><Clock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /><span>{CONTATO_PPGFIL.atendimento}</span></p>
            <p className="flex gap-3"><MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /><span>{CONTATO_PPGFIL.endereco}</span></p>
            <p className="text-xs">Inscrição em disciplinas: <a href={`mailto:${CONTATO_PPGFIL.emailInscricoes}`} className="font-bold text-primary hover:underline">{CONTATO_PPGFIL.emailInscricoes}</a></p>
            <div className="flex flex-wrap gap-3 border-t border-border pt-3 text-xs font-bold">
              <a href={CONTATO_PPGFIL.ouvidoria} target="_blank" rel="noreferrer" className="text-primary hover:underline">Ouvidoria-Geral da UERJ</a>
              <a href={CONTATO_PPGFIL.sic} target="_blank" rel="noreferrer" className="text-primary hover:underline">Serviço de Informação ao Cidadão (SIC)</a>
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
