import { CircleCheckBig, Clock, FileText, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatarData } from '@/lib/store'
import { STATUS_STYLES, type EntradaHistorico } from '@/lib/types'
import { AnexoChip } from '@/components/anexos'

function iconePara(entrada: EntradaHistorico) {
  if (entrada.origem === 'secretaria') return Info
  if (entrada.status === 'Deferido' || entrada.status === 'Indeferido') return CircleCheckBig
  if (entrada.status === 'Com exigência') return FileText
  return Clock
}

/* Ordem: mais recente no TOPO (padrão mantido em todo o sistema) */
export function Timeline({
  historico,
  exibirAutor = true,
}: {
  historico: EntradaHistorico[]
  exibirAutor?: boolean
}) {
  const itens = [...historico].reverse()

  return (
    <ol className="relative grid gap-0">
      {itens.map((e, i) => {
        const Icone = iconePara(e)
        const s = STATUS_STYLES[e.status]
        const atual = i === 0
        const ultimo = i === itens.length - 1

        return (
          <li key={e.id} className="relative grid grid-cols-[2.25rem_1fr] gap-x-3 pb-5 last:pb-0">
            {!ultimo && (
              <span
                className="absolute left-[1.125rem] top-9 bottom-0 w-px -translate-x-1/2 bg-border"
                aria-hidden="true"
              />
            )}
            <span
              className={cn(
                'relative z-1 grid size-9 place-items-center rounded-full text-primary-foreground',
                s.column,
                atual ? 'ring-4 ring-offset-0' : 'opacity-80',
              )}
              style={atual ? { boxShadow: '0 0 0 4px color-mix(in oklab, currentColor 0%, #6B1E2C 12%)' } : undefined}
            >
              <Icone className="size-4" aria-hidden="true" />
            </span>

            <div
              className={cn(
                'min-w-0 rounded-xl border px-4 py-3',
                atual ? 'border-primary/25 bg-card shadow-sm' : 'border-border bg-card/60',
              )}
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-sm font-extrabold text-foreground">{e.status}</span>
                {atual && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-primary-foreground">
                    Etapa atual
                  </span>
                )}
                <span className="ml-auto text-xs font-semibold text-muted-foreground">
                  {formatarData(e.data)}
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                {exibirAutor ? e.mensagem : mensagemPublica(e.mensagem)}
              </p>
              <p className="mt-1.5 text-xs font-semibold text-muted-foreground">
                {e.origem === 'sistema'
                  ? 'Registro automático'
                  : e.origem === 'solicitante'
                    ? 'Enviado pelo solicitante'
                    : 'Atualização da secretaria'}
                {exibirAutor && <> · {e.autor}</>}
              </p>
              {e.anexos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                  {e.anexos.map((a) => (
                    <AnexoChip key={a.id} anexo={a} />
                  ))}
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function mensagemPublica(mensagem: string) {
  if (mensagem.startsWith('Protocolo arquivado por ')) return 'Protocolo arquivado'
  if (mensagem.startsWith('Protocolo desarquivado por ')) return 'Protocolo desarquivado'
  return mensagem
}
