'use client'

import { useDeferredValue, useMemo, useState } from 'react'
import Link from 'next/link'
import { Archive, ArrowLeft, Search } from 'lucide-react'
import { PageHeader } from '@/components/admin-shell'
import { TextInput } from '@/components/form-field'
import { useProtocolos } from '@/hooks/use-protocolos'
import { formatarCPF, formatarData, soDigitos } from '@/lib/store'
import { TableSkeleton } from '@/components/loading-skeletons'

export function ProtocolosArquivados() {
  const { protocolos, carregado, carregando, erro } = useProtocolos({ incluirArquivados: true })
  const [busca, setBusca] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const buscaAdiada = useDeferredValue(busca)

  const arquivados = useMemo(() => {
    const termo = buscaAdiada.trim().toLowerCase()
    const digitos = soDigitos(buscaAdiada)
    const inicio = dataInicio ? new Date(`${dataInicio}T00:00:00`).getTime() : null
    const fim = dataFim ? new Date(`${dataFim}T23:59:59.999`).getTime() : null

    return protocolos
      .filter((p) => {
        if (!p.arquivado || !p.arquivadoEm) return false
        const data = new Date(p.arquivadoEm).getTime()
        if (inicio !== null && data < inicio) return false
        if (fim !== null && data > fim) return false
        if (!termo) return true
        return (
          p.nome.toLowerCase().includes(termo) ||
          p.numero.toLowerCase().includes(termo) ||
          (digitos.length > 0 && p.cpf.includes(digitos))
        )
      })
      .sort((a, b) => (b.arquivadoEm ?? '').localeCompare(a.arquivadoEm ?? ''))
  }, [protocolos, buscaAdiada, dataInicio, dataFim])

  return (
    <div className="min-h-dvh">
      <PageHeader
        titulo="Protocolos arquivados"
        descricao="Consulte protocolos concluídos que foram retirados da esteira principal."
      >
        <Link href="/admin/protocolos" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-xs font-extrabold text-foreground hover:border-primary/40 hover:text-primary">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar à esteira
        </Link>
      </PageHeader>

      <div className="border-b border-border bg-background px-6 py-4 lg:px-8">
        <div className="grid gap-3 md:grid-cols-[minmax(16rem,1fr)_12rem_12rem]">
          <div className="grid gap-1.5">
            <label htmlFor="busca-arquivados" className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Buscar</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <TextInput id="busca-arquivados" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome, CPF ou protocolo" className="pl-10" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="arquivo-inicio" className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Arquivado desde</label>
            <TextInput id="arquivo-inicio" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="arquivo-fim" className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Arquivado até</label>
            <TextInput id="arquivo-fim" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          </div>
        </div>
      </div>

      <main className="px-6 py-6 lg:px-8">
        {!carregado || carregando ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"><TableSkeleton rows={7} columns={7} /></div>
        ) : erro ? (
          <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/8 p-5 text-sm font-bold text-destructive">{erro}</div>
        ) : arquivados.length === 0 ? (
          <div className="grid min-h-64 place-items-center rounded-2xl border-2 border-dashed border-border bg-card/50 p-8 text-center">
            <div>
              <Archive className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
              <p className="mt-3 text-sm font-extrabold text-foreground">Nenhum protocolo arquivado encontrado</p>
              <p className="mt-1 text-xs text-muted-foreground">Ajuste os filtros ou arquive um protocolo finalizado.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="bg-secondary/60">
                <tr>
                  <th className="w-[18%] px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Protocolo</th>
                  <th className="w-[22%] px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Nome</th>
                  <th className="hidden w-[15%] px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-muted-foreground md:table-cell">CPF</th>
                  <th className="hidden w-[18%] px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-muted-foreground lg:table-cell">Tipo</th>
                  <th className="w-[13%] px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Etapa</th>
                  <th className="hidden w-[18%] px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-muted-foreground sm:table-cell">Arquivamento</th>
                  <th className="hidden w-[16%] px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-muted-foreground xl:table-cell">Responsável</th>
                </tr>
              </thead>
              <tbody>
                {arquivados.map((p) => (
                  <tr key={p.id} className="border-t border-border transition hover:bg-secondary/25">
                    <td className="px-4 py-4"><Link href={`/admin/protocolos/${encodeURIComponent(p.id)}`} className="block truncate font-mono text-xs font-extrabold text-primary hover:underline">{p.numero}</Link></td>
                    <td className="truncate px-4 py-4 font-bold text-foreground">{p.nome}</td>
                    <td className="hidden truncate px-4 py-4 font-mono text-xs text-muted-foreground md:table-cell">{formatarCPF(p.cpf)}</td>
                    <td className="hidden truncate px-4 py-4 text-muted-foreground lg:table-cell">{p.tipo}</td>
                    <td className="px-4 py-4"><span className="rounded-full bg-secondary px-2 py-1 text-[10px] font-extrabold text-muted-foreground">{p.status}</span></td>
                    <td className="hidden truncate px-4 py-4 text-xs text-muted-foreground sm:table-cell">{formatarData(p.arquivadoEm!)}</td>
                    <td className="hidden truncate px-4 py-4 text-xs text-muted-foreground xl:table-cell">{p.responsavel ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
