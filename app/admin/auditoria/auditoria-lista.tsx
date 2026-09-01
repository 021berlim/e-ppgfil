'use client'

import { useEffect, useDeferredValue, useState } from 'react'
import { ChevronLeft, ChevronRight, Search, ScrollText } from 'lucide-react'
import type { RegistroAuditoria } from '@/lib/types'
import { formatarData } from '@/lib/store'
import { TableSkeleton } from '@/components/loading-skeletons'

const REGISTROS_POR_PAGINA = 50

export function AuditoriaLista() {
  const [registros, setRegistros] = useState<RegistroAuditoria[]>([])
  const [total, setTotal] = useState(0)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [busca, setBusca] = useState('')
  const buscaAdiada = useDeferredValue(busca)
  const [categoria, setCategoria] = useState('todas')
  const [pagina, setPagina] = useState(1)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let cancelado = false
    setCarregando(true)

    const carregar = async () => {
      try {
        const params = new URLSearchParams({
          pagina: String(pagina),
          limite: String(REGISTROS_POR_PAGINA),
        })
        if (categoria !== 'todas') params.set('categoria', categoria)
        if (buscaAdiada.trim()) params.set('busca', buscaAdiada.trim())

        const resposta = await fetch(`/api/admin/audit-logs?${params.toString()}`, { cache: 'no-store' })
        if (!resposta.ok) {
          if (!cancelado) {
            setRegistros([])
            setTotal(0)
            setTotalPaginas(1)
            setCarregando(false)
          }
          return
        }

        const dados = await resposta.json()
        if (!cancelado) {
          if (dados && Array.isArray(dados.itens)) {
            setRegistros(dados.itens)
            setTotal(dados.total ?? dados.itens.length)
            setTotalPaginas(dados.totalPaginas ?? 1)
          } else if (Array.isArray(dados)) {
            setRegistros(dados)
            setTotal(dados.length)
            setTotalPaginas(Math.max(1, Math.ceil(dados.length / REGISTROS_POR_PAGINA)))
          }
          setCarregando(false)
        }
      } catch (erro) {
        if (!cancelado) {
          console.error('[Auditoria] Erro ao carregar logs:', erro)
          setRegistros([])
          setTotal(0)
          setTotalPaginas(1)
          setCarregando(false)
        }
      }
    }

    void carregar()
    return () => {
      cancelado = true
    }
  }, [pagina, categoria, buscaAdiada])

  useEffect(() => {
    setPagina(1)
  }, [buscaAdiada, categoria])

  return (
    <section className="px-6 py-6 lg:px-8">
      <div className="mb-4 grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_14rem]">
        <label className="relative">
          <span className="sr-only">Buscar nos logs</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Buscar por e-mail, ação ou protocolo"
            className="h-11 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </label>
        <label>
          <span className="sr-only">Filtrar categoria</span>
          <select
            value={categoria}
            onChange={(evento) => setCategoria(evento.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm font-bold outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            <option value="todas">Todas as categorias</option>
            <option value="protocolo">Protocolos</option>
            <option value="autenticacao">Autenticação</option>
            <option value="documento">Documentos</option>
            <option value="sistema">Sistema</option>
          </select>
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {carregando ? (
          <TableSkeleton rows={7} columns={5} />
        ) : (
          <>
            <div className="max-h-[calc(100vh-20rem)] min-h-80 overflow-auto overscroll-contain">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-secondary text-xs uppercase tracking-wider text-muted-foreground shadow-sm">
              <tr>
                <th className="px-5 py-3 font-extrabold">Data e hora</th>
                <th className="px-5 py-3 font-extrabold">Responsável</th>
                <th className="px-5 py-3 font-extrabold">Ação</th>
                <th className="px-5 py-3 font-extrabold">Protocolo</th>
                <th className="px-5 py-3 font-extrabold">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {registros.map((registro) => (
                <tr key={registro.id} className="align-top transition hover:bg-secondary/40">
                  <td className="whitespace-nowrap px-5 py-4 text-xs font-semibold text-muted-foreground">{formatarData(registro.data)}</td>
                  <td className="px-5 py-4 font-bold text-foreground">{registro.ator}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-extrabold text-primary">{registro.acao}</span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-bold text-foreground">{registro.protocoloNumero ?? '—'}</td>
                  <td className="max-w-md px-5 py-4 text-sm leading-relaxed text-muted-foreground">{registro.detalhes}</td>
                </tr>
              ))}
            </tbody>
          </table>
            </div>

        {registros.length === 0 && (
          <div className="grid place-items-center px-6 py-16 text-center">
            <ScrollText className="size-9 text-muted-foreground/50" aria-hidden="true" />
            <p className="mt-3 text-sm font-extrabold text-foreground">Nenhum registro encontrado</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Novas ações administrativas aparecerão automaticamente nesta trilha.
            </p>
          </div>
        )}
          </>
        )}
      </div>

      <div className="mt-3 flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-xs font-semibold text-muted-foreground">
          {total === 0
            ? 'Nenhum registro'
            : `Exibindo ${(pagina - 1) * REGISTROS_POR_PAGINA + 1}–${Math.min(
                pagina * REGISTROS_POR_PAGINA,
                total,
              )} de ${total} registro(s)`}
        </p>

        {totalPaginas > 1 && (
          <nav className="flex items-center gap-2" aria-label="Paginação dos logs de auditoria">
            <button
              type="button"
              onClick={() => setPagina((atual) => Math.max(1, atual - 1))}
              disabled={pagina === 1}
              className="grid size-9 place-items-center rounded-full border border-border bg-card text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Página anterior"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <span className="min-w-24 text-center text-xs font-bold text-muted-foreground">
              Página {pagina} de {totalPaginas}
            </span>
            <button
              type="button"
              onClick={() => setPagina((atual) => Math.min(totalPaginas, atual + 1))}
              disabled={pagina === totalPaginas}
              className="grid size-9 place-items-center rounded-full border border-border bg-card text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Próxima página"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </nav>
        )}
      </div>
    </section>
  )
}
