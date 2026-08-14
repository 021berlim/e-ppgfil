import { PageHeader } from '@/components/admin-shell'
import { PROCEDIMENTOS } from '@/lib/conteudo-institucional'

export const metadata = { title: 'Procedimentos Internos | e-PPGFIL' }

export default function ProcedimentosPage() {
  return (
    <>
      <PageHeader
        titulo="Procedimentos Internos"
        descricao="Fluxos padronizados da secretaria para tramitação das solicitações mais frequentes."
      />
      <div className="grid gap-4 px-6 py-6 lg:px-8">
        {PROCEDIMENTOS.map((p) => (
          <article key={p.titulo} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-extrabold text-foreground">{p.titulo}</h2>
              <span className="rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs font-bold text-foreground">
                Prazo: {p.prazo}
              </span>
            </div>
            <ol className="mt-4 grid gap-3">
              {p.passos.map((passo, i) => (
                <li key={passo} className="flex gap-3 text-sm leading-relaxed text-foreground">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-extrabold text-primary-foreground">
                    {i + 1}
                  </span>
                  {passo}
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>
    </>
  )
}
