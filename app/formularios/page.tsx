import Link from 'next/link'
import { ArrowLeft, Download, FileText } from 'lucide-react'
import { FormCard, PublicShell } from '@/components/public-shell'
import { FORMULARIOS } from '@/lib/conteudo-institucional'

export const metadata = {
  title: 'Formulários | e-PPGFIL',
  description: 'Formulários oficiais do Programa de Pós-Graduação em Filosofia da UERJ.',
}

export default function FormulariosPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar ao início
        </Link>

        <FormCard
          titulo="Formulários"
          descricao="Consulte e baixe os formulários oficiais do Programa de Pós-Graduação em Filosofia da UERJ."
        >
          <div className="grid gap-3">
            {FORMULARIOS.map((formulario) => (
              <article
                key={formulario.nome}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-background px-4 py-4 shadow-sm sm:flex-row sm:items-center"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <FileText className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-extrabold text-foreground">{formulario.nome}</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formulario.url
                      ? `Arquivo ${formulario.tipo}`
                      : 'Arquivo ainda não publicado no site oficial'}
                  </p>
                </div>
                {formulario.url ? (
                  <a
                    href={formulario.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-extrabold text-primary-foreground transition hover:opacity-90"
                    aria-label={`Baixar ${formulario.nome}`}
                  >
                    <Download className="size-4" aria-hidden="true" />
                    Baixar
                  </a>
                ) : (
                  <span className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full bg-secondary px-4 py-2 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    Indisponível
                  </span>
                )}
              </article>
            ))}
          </div>

          <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
            Os arquivos são mantidos pelo PPGFIL/UERJ e abrem em uma nova aba.
          </p>
        </FormCard>
      </div>
    </PublicShell>
  )
}
