import { PageHeader } from '@/components/admin-shell'
import { CORPO_DOCENTE, FORMACAO_DOCENTE } from '@/lib/conteudo-institucional'

export const metadata = { title: 'Corpo Docente | e-PPGFIL' }

export default function CorpoDocentePage() {
  return (
    <>
      <PageHeader
        titulo="Corpo Docente"
        descricao="Docentes publicados pelo PPGFIL e informações disponíveis em suas páginas oficiais."
      />
      <div className="px-6 py-6 lg:px-8">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="max-h-[calc(100vh-15rem)] overflow-auto overscroll-contain">
            <table className="w-full min-w-[1100px] text-left text-sm">
            <caption className="sr-only">
              Lista de docentes do PPGFIL, cargos, linhas de pesquisa e áreas de atuação
            </caption>
            <thead className="bg-secondary/60">
              <tr>
                {['Docente', 'Cargo', 'Linha de pesquisa', 'Área de atuação', 'Maior pós-graduação', 'Currículo Lattes'].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CORPO_DOCENTE.map((d) => {
                const formacao = FORMACAO_DOCENTE[d.nome]
                return (
                  <tr key={d.nome} className="border-t border-border">
                    <th scope="row" className="px-5 py-4 font-extrabold text-foreground">
                    <a href={d.url} target="_blank" rel="noreferrer" className="hover:text-primary hover:underline">
                      {d.nome}
                    </a>
                    </th>
                    <td className="px-5 py-4 font-semibold text-foreground">{d.cargo}</td>
                    <td className="px-5 py-4">
                    {d.linha ? (
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{d.linha}</span>
                    ) : (
                      <span className="text-xs font-semibold text-muted-foreground">TODO: não publicada</span>
                    )}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{d.atuacao ?? 'TODO: área não detalhada na página individual'}</td>
                    <td className="max-w-xs px-5 py-4 text-muted-foreground">{formacao?.posGraduacao ?? 'TODO: formação não confirmada na fonte pública'}</td>
                    <td className="px-5 py-4">
                    {formacao?.lattes ? (
                      <a href={formacao.lattes} target="_blank" rel="noreferrer" className="font-bold text-primary hover:underline">Abrir Lattes</a>
                    ) : (
                      <span className="text-xs font-semibold text-muted-foreground">TODO: link não publicado</span>
                    )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </>
  )
}
