'use client'

import { useMemo } from 'react'
import { AlarmClock, FileStack, Timer, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { estaAtrasado } from '@/lib/store'
import {
  STATUS_FINAIS,
  STATUS_LIST,
  STATUS_STYLES,
  TIPOS_SOLICITACAO,
  type Protocolo,
  type Status,
} from '@/lib/types'
import { useProtocolos } from '@/hooks/use-protocolos'
import { PageHeader } from '@/components/admin-shell'

const DIA_MS = 1000 * 60 * 60 * 24

function dataConclusao(p: Protocolo): string | null {
  if (!STATUS_FINAIS.includes(p.status)) return null
  const entrada = [...p.historico]
    .reverse()
    .find((h) => STATUS_FINAIS.includes(h.status))
  return entrada?.data ?? p.atualizadoEm
}

function Barra({
  label,
  valor,
  max,
  cor,
}: {
  label: string
  valor: number
  max: number
  cor: string
}) {
  const pct = max > 0 ? Math.round((valor / max) * 100) : 0
  return (
    <div className="grid grid-cols-[10rem_1fr_2.5rem] items-center gap-3">
      <span className="truncate text-sm font-bold text-foreground">{label}</span>
      <div className="h-3 overflow-hidden rounded-full bg-secondary">
        <div className={cn('h-full rounded-full transition-all', cor)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-right text-sm font-extrabold tabular-nums text-foreground">
        {valor}
      </span>
    </div>
  )
}

export function PainelDashboard() {
  const { protocolos, carregado } = useProtocolos()

  const m = useMemo(() => {
    const porStatus = {} as Record<Status, number>
    STATUS_LIST.forEach((s) => (porStatus[s] = 0))
    const porTipo: Record<string, number> = {}
    TIPOS_SOLICITACAO.forEach((t) => (porTipo[t] = 0))

    let atrasados = 0
    let somaDias = 0
    let concluidos = 0

    for (const p of protocolos) {
      porStatus[p.status] = (porStatus[p.status] ?? 0) + 1
      porTipo[p.tipo] = (porTipo[p.tipo] ?? 0) + 1
      if (estaAtrasado(p)) atrasados++
      const fim = dataConclusao(p)
      if (fim) {
        concluidos++
        somaDias += (new Date(fim).getTime() - new Date(p.criadoEm).getTime()) / DIA_MS
      }
    }

    const tiposOrdenados = Object.entries(porTipo)
      .sort((a, b) => b[1] - a[1])
      .map(([tipo]) => tipo)

    const tempoMedio = concluidos > 0 ? somaDias / concluidos : 0
    return {
      total: protocolos.length,
      porStatus,
      porTipo,
      tiposOrdenados,
      atrasados,
      concluidos,
      tempoMedio,
      maxStatus: Math.max(1, ...Object.values(porStatus)),
      maxTipo: Math.max(1, ...Object.values(porTipo)),
    }
  }, [protocolos])

  const cards = [
    {
      label: 'Total de protocolos',
      valor: m.total.toLocaleString('pt-BR'),
      icone: FileStack,
      tom: 'bg-primary/10 text-primary',
    },
    {
      label: 'Protocolos atrasados',
      valor: m.atrasados.toLocaleString('pt-BR'),
      icone: TriangleAlert,
      tom: 'bg-destructive/12 text-destructive',
    },
    {
      label: 'Concluídos',
      valor: m.concluidos.toLocaleString('pt-BR'),
      icone: AlarmClock,
      tom: 'bg-[#3F7355]/15 text-[#2d5540]',
    },
    {
      label: 'Tempo médio de conclusão',
      valor: m.concluidos > 0 ? `${m.tempoMedio.toFixed(1)} dias` : '—',
      icone: Timer,
      tom: 'bg-accent/20 text-[#7d6410]',
    },
  ]

  return (
    <>
      <PageHeader
        titulo="Painel"
        descricao="Métricas dos protocolos registrados na secretaria do PPGFIL, calculadas em tempo real a partir dos dados locais."
      />

      <div className="grid gap-6 px-6 py-6 lg:px-8">
        {!carregado ? (
          <p className="text-sm font-bold text-muted-foreground">Carregando métricas…</p>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {cards.map((c) => (
                <div
                  key={c.label}
                  className="rounded-2xl border border-border bg-card px-5 py-5 shadow-sm"
                >
                  <span className={cn('grid size-10 place-items-center rounded-xl', c.tom)}>
                    <c.icone className="size-5" aria-hidden="true" />
                  </span>
                  <p className="mt-3 text-3xl font-extrabold tracking-tight text-foreground">
                    {c.valor}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-muted-foreground">{c.label}</p>
                </div>
              ))}
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h2 className="text-base font-extrabold text-foreground">Protocolos por etapa</h2>
                <div className="mt-5 grid gap-3">
                  {STATUS_LIST.map((s) => (
                    <Barra
                      key={s}
                      label={s}
                      valor={m.porStatus[s]}
                      max={m.maxStatus}
                      cor={STATUS_STYLES[s].column}
                    />
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h2 className="text-base font-extrabold text-foreground">
                  Protocolos por tipo de solicitação
                </h2>
                <div className="mt-5 grid gap-3 max-h-[380px] overflow-y-auto pr-1">
                  {m.tiposOrdenados.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhum protocolo registrado.</p>
                  ) : (
                    m.tiposOrdenados.map((t) => (
                      <Barra
                        key={t}
                        label={t}
                        valor={m.porTipo[t] ?? 0}
                        max={m.maxTipo}
                        cor="bg-primary"
                      />
                    ))
                  )}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </>
  )
}
