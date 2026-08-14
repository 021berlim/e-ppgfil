import { Download, FileText } from 'lucide-react'
import { PageHeader } from '@/components/admin-shell'
import { FORMULARIOS } from '@/lib/conteudo-institucional'

export const metadata = { title: 'Documentos | e-PPGFIL' }

export default function DocumentosPage() {
  return (
    <>
      <PageHeader
        titulo="Documentos"
        descricao="Formulários oficiais do PPGFIL disponíveis para consulta e download."
      />
      <div className="grid gap-3 px-6 py-6 lg:grid-cols-2 lg:px-8">
        {FORMULARIOS.map((formulario) => (
          <div
            key={formulario.nome}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <FileText className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-foreground">{formulario.nome}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formulario.url ? `Arquivo ${formulario.tipo}` : 'Arquivo não publicado no site oficial'}
              </p>
            </div>
            {formulario.url ? (
              <a
                href={formulario.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-extrabold text-primary-foreground transition hover:opacity-90"
                aria-label={`Baixar ${formulario.nome}`}
              >
                <Download className="size-3.5" aria-hidden="true" />
                Baixar
              </a>
            ) : (
              <span className="shrink-0 rounded-full bg-secondary px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                Indisponível
              </span>
            )}
          </div>
        ))}
      </div>
      <p className="px-6 pb-8 text-xs text-muted-foreground lg:px-8">
        Arquivos fornecidos pelo site oficial do PPGFIL/UERJ.
      </p>
    </>
  )
}
