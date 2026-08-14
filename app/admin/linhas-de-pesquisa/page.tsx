import { PageHeader } from '@/components/admin-shell'
import { LINHAS_PESQUISA } from '@/lib/conteudo-institucional'

export const metadata = { title: 'Linhas de Pesquisa | e-PPGFIL' }

export default function LinhasPesquisaPage() {
  return (
    <>
      <PageHeader
        titulo="Linhas de Pesquisa"
        descricao="Áreas de concentração vigentes do Programa de Pós-Graduação em Filosofia."
      />
      <div className="grid gap-4 px-6 py-6 lg:grid-cols-2 lg:px-8">
        {LINHAS_PESQUISA.map((l) => (
          <article
            key={l.titulo}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <h2 className="text-lg font-extrabold text-foreground">{l.titulo}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{l.resumo}</p>
            <p className="mt-4 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              Disciplinas vinculadas
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {l.disciplinas.map((d) => (
                <li
                  key={d}
                  className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground"
                >
                  {d}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </>
  )
}
