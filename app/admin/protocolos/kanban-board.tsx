'use client'

import { memo, useCallback, useDeferredValue, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { Archive, ChevronDown, GripVertical, Paperclip, Search, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  cargoAtual,
  estaAtrasado,
  formatarCPF,
  formatarData,
  soDigitos,
  usuarioAtual,
} from '@/lib/store'
import { isCoordinator } from '@/lib/auth-types'
import {
  STATUS_FINAIS,
  STATUS_LIST,
  STATUS_STYLES,
  type Protocolo,
  type Status,
} from '@/lib/types'
import { useProtocolos } from '@/hooks/use-protocolos'
import { PageHeader } from '@/components/admin-shell'
import { Select, TextInput } from '@/components/form-field'
import { toast } from '@/components/toast'
import { ConfirmacaoModal } from '@/components/confirmacao-modal'
import { TourGuiado, type TourStep } from '@/components/tour-guiado'
import { gerenciarProtocoloRemoto, moverStatusRemoto } from '@/lib/protocolos-client'

const PASSOS_TUTORIAL: TourStep[] = [
  { alvo: '[data-tour="admin-sidebar"]', titulo: 'Navegação principal', texto: 'Use este menu para acessar a esteira, o painel e os conteúdos administrativos.', posicao: 'right' },
  { alvo: '[data-tour="protocol-search"]', titulo: 'Busca rápida', texto: 'Encontre protocolos pelo nome, CPF ou número de identificação.', posicao: 'bottom' },
  { alvo: '[data-tour="protocol-filters"]', titulo: 'Filtros', texto: 'Refine a esteira por tipo de solicitação ou servidor responsável.', posicao: 'bottom' },
  { alvo: '[data-tour="kanban-columns"]', titulo: 'Etapas da esteira', texto: 'As colunas mostram o andamento: gerado, em tramitação, com exigência e etapas finais.', posicao: 'top' },
  { alvo: '[data-tour="protocol-card"]', titulo: 'Card do protocolo', texto: 'Veja rapidamente o solicitante, CPF, categoria, tipo e data de abertura.', posicao: 'right' },
  { alvo: '[data-tour="protocol-card"]', titulo: 'Mover entre etapas', texto: 'Arraste o card por qualquer região para mudar a etapa do protocolo.', posicao: 'right', animacao: 'arrastar' },
  { alvo: '[data-tour="card-actions"]', titulo: 'Informações e ações', texto: 'O rodapé reúne anexos, responsável e ações disponíveis para o protocolo.', posicao: 'top' },
]

type FaixaTempoId = 'hoje' | 'semana' | 'antigos'

type FaixaTempo = {
  id: FaixaTempoId
  nome: string
  itens: Protocolo[]
}

type ResponsavelAtribuivel = {
  id: string
  name: string
  email: string
  avatar_url: string | null
  role: 'SECRETARY_ADMIN' | 'SECRETARY_OPERATOR'
}

const FAIXAS_TEMPO: Array<{ id: FaixaTempoId; nome: string }> = [
  { id: 'hoje', nome: 'Hoje' },
  { id: 'semana', nome: 'Essa semana' },
  { id: 'antigos', nome: 'Mais de 7 dias' },
]

const ESTILOS_FAIXA: Record<
  FaixaTempoId,
  { cabecalho: string; icone: string; contador: string }
> = {
  hoje: {
    cabecalho: 'border-[#2563EB]/55 hover:border-[#2563EB]',
    icone: 'text-[#1D4ED8]',
    contador: 'bg-[#2563EB]/10 text-[#1D4ED8]',
  },
  semana: {
    cabecalho: 'border-[#B7791F]/60 hover:border-[#B7791F]',
    icone: 'text-[#8A5A12]',
    contador: 'bg-[#B7791F]/12 text-[#79500F]',
  },
  antigos: {
    cabecalho: 'border-[#B42318]/55 hover:border-[#B42318]',
    icone: 'text-[#B42318]',
    contador: 'bg-[#B42318]/10 text-[#9F1F16]',
  },
}

function dataEntradaEtapaAtual(p: Protocolo) {
  let entrada = p.criadoEm
  let encontrouEtapaAtual = false

  for (let i = p.historico.length - 1; i >= 0; i--) {
    const item = p.historico[i]
    if (item.status === p.status) {
      entrada = item.data
      encontrouEtapaAtual = true
    } else if (encontrouEtapaAtual) {
      break
    }
  }

  return entrada
}

export function calcularDiasParado(p: Protocolo, hoje = new Date()) {
  const entrada = new Date(dataEntradaEtapaAtual(p))
  if (Number.isNaN(entrada.getTime())) return 0

  const inicioUtc = Date.UTC(entrada.getFullYear(), entrada.getMonth(), entrada.getDate())
  const hojeUtc = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  return Math.max(0, Math.floor((hojeUtc - inicioUtc) / 86_400_000))
}

function agruparPorTempo(itens: Protocolo[]): FaixaTempo[] {
  const grupos: Record<FaixaTempoId, Protocolo[]> = { hoje: [], semana: [], antigos: [] }
  const hoje = new Date()

  itens.forEach((p) => {
    const diasParado = calcularDiasParado(p, hoje)
    if (diasParado === 0) grupos.hoje.push(p)
    else if (diasParado <= 6) grupos.semana.push(p)
    else grupos.antigos.push(p)
  })

  return FAIXAS_TEMPO.map((faixa) => ({ ...faixa, itens: grupos[faixa.id] }))
}

function contarAnexos(p: Protocolo) {
  return p.historico.reduce((acc, h) => acc + h.anexos.length, 0)
}

export function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/)
  const primeira = partes[0]?.[0] ?? ''
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return (primeira + ultima).toUpperCase()
}

function CardConteudo({
  p,
  dragging,
  onOpen,
  onArchive,
  responsaveisPorNome,
}: {
  p: Protocolo
  dragging?: boolean
  onOpen?: () => void
  onArchive?: () => void
  responsaveisPorNome?: Record<string, string | null>
}) {
  const anexos = contarAnexos(p)
  const atrasado = estaAtrasado(p)
  const avatarResponsavel = p.responsavel ? responsaveisPorNome?.[p.responsavel] : null
  return (
    <div
      data-tour="protocol-card"
      className={cn(
        'rounded-xl border bg-card px-3.5 py-3 shadow-sm transition',
        atrasado ? 'border-destructive/40' : 'border-border',
        dragging
          ? 'rotate-2 shadow-lg'
          : 'hover:border-primary/40 hover:shadow-md',
      )}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-muted-foreground/60">
          <GripVertical className="size-4" aria-hidden="true" />
        </span>
        <div
          role={onOpen ? 'button' : undefined}
          tabIndex={onOpen ? 0 : undefined}
          onClick={onOpen}
          onKeyDown={(e) => {
            if (onOpen && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault()
              onOpen()
            }
          }}
          aria-label={`Abrir detalhes do protocolo ${p.numero} de ${p.nome}`}
          className="min-w-0 flex-1 rounded-lg text-left outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-xs font-extrabold text-primary">{p.numero}</p>
            {atrasado && (
              <span className="inline-flex items-center gap-1 rounded-full bg-destructive/12 px-2 py-0.5 text-[10px] font-extrabold text-destructive">
                <TriangleAlert className="size-3" aria-hidden="true" />
                Atrasado
              </span>
            )}
          </div>
          <p className="mt-1 truncate text-sm font-extrabold text-foreground">{p.nome}</p>
          <p className="font-mono text-[11px] text-muted-foreground">{formatarCPF(p.cpf)}</p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground">
              {p.categoria}
            </span>
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
              {p.tipo}
            </span>
            {p.status === 'Com exigência' && p.subetapaExigencia === 'respondida' && (
              <span className="rounded-full border border-[#B7791F]/40 bg-[#B7791F]/12 px-2 py-0.5 text-[10px] font-extrabold text-[#79500F]">
                Aguardando conferência
              </span>
            )}
          </div>

          <div data-tour="card-actions" className="mt-2.5 flex items-center justify-between gap-2 border-t border-border pt-2">
            <span className="text-[10px] font-semibold text-muted-foreground">
              {formatarData(p.criadoEm)}
            </span>
            <div className="flex items-center gap-2">
              {STATUS_FINAIS.includes(p.status) && onArchive && (
                <button
                  type="button"
                  title="Arquivar protocolo"
                  aria-label={`Arquivar protocolo ${p.numero}`}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation()
                    onArchive()
                  }}
                  className="grid size-6 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-primary"
                >
                  <Archive className="size-3.5" aria-hidden="true" />
                </button>
              )}
              {anexos > 0 && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-[10px] font-bold',
                    p.subetapaExigencia === 'respondida'
                      ? 'text-[#8A5A12]'
                      : 'text-muted-foreground',
                  )}
                >
                  <Paperclip className="size-3" aria-hidden="true" />
                  {anexos}
                </span>
              )}
              {p.responsavel && (
                <span
                  title={`Responsável: ${p.responsavel}`}
                  className="grid size-6 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/12 text-[10px] font-extrabold text-primary"
                >
                  {avatarResponsavel ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarResponsavel}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    iniciais(p.responsavel)
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const CardArrastavel = memo(function CardArrastavel({
  p,
  onOpen,
  onArchive,
  readOnly,
  responsaveisPorNome,
}: {
  p: Protocolo
  onOpen: (id: string) => void
  onArchive: (id: string) => void
  readOnly: boolean
  responsaveisPorNome: Record<string, string | null>
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: p.id, disabled: readOnly })

  return (
    <div
      ref={setNodeRef}
      {...(readOnly ? {} : listeners)}
      {...(readOnly ? {} : attributes)}
      className={cn(
        'w-full min-w-0 max-w-full touch-none rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-primary/25',
        readOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-40',
      )}
    >
      <CardConteudo
        p={p}
        onOpen={() => onOpen(p.id)}
        onArchive={readOnly ? undefined : () => onArchive(p.id)}
        responsaveisPorNome={responsaveisPorNome}
      />
    </div>
  )
})

const GrupoColuna = memo(function GrupoColuna({
  grupo,
  aberto,
  onToggle,
  onOpen,
  onArchive,
  readOnly,
  responsaveisPorNome,
}: {
  grupo: FaixaTempo
  aberto: boolean
  onToggle: (id: FaixaTempoId) => void
  onOpen: (id: string) => void
  onArchive: (id: string) => void
  readOnly: boolean
  responsaveisPorNome: Record<string, string | null>
}) {
  const conteudoId = useId()
  const estilo = ESTILOS_FAIXA[grupo.id]

  return (
    <section className="min-w-0 max-w-full">
      <button
        type="button"
        aria-expanded={aberto}
        aria-controls={conteudoId}
        onClick={() => onToggle(grupo.id)}
        className={cn(
          'flex w-full cursor-pointer select-none items-center gap-2 rounded-lg border bg-card px-2.5 py-2 text-left shadow-sm transition hover:bg-secondary/45 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20',
          estilo.cabecalho,
        )}
      >
        <ChevronDown
          className={cn(
            'size-3.5 shrink-0 transition-transform',
            estilo.icone,
            !aberto && '-rotate-90',
          )}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 truncate text-xs font-bold text-foreground">
          {grupo.nome}
        </span>
        <span
          className={cn(
            'grid min-w-6 place-items-center rounded-full px-1.5 py-0.5 text-xs font-extrabold tabular-nums',
            estilo.contador,
          )}
        >
          {grupo.itens.length}
        </span>
      </button>

      {aberto && (
        <div id={conteudoId} className="mt-2.5 grid min-w-0 gap-2.5">
          {grupo.itens.map((p) => (
            <CardArrastavel
              key={p.id}
              p={p}
              onOpen={onOpen}
              onArchive={onArchive}
              readOnly={readOnly}
              responsaveisPorNome={responsaveisPorNome}
            />
          ))}
        </div>
      )}
    </section>
  )
})

const Coluna = memo(function Coluna({
  status,
  itens,
  onOpen,
  onArchive,
  mostrarCardTour,
  readOnly,
  responsaveisPorNome,
}: {
  status: Status
  itens: Protocolo[]
  onOpen: (id: string) => void
  onArchive: (id: string) => void
  mostrarCardTour: boolean
  readOnly: boolean
  responsaveisPorNome: Record<string, string | null>
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status, disabled: readOnly })
  const s = STATUS_STYLES[status]
  const grupos = useMemo(() => agruparPorTempo(itens), [itens])
  const [gruposAbertos, setGruposAbertos] = useState<Record<FaixaTempoId, boolean>>({
    hoje: false,
    semana: false,
    antigos: false,
  })
  const estadoAntesDoTour = useRef<Record<FaixaTempoId, boolean> | null>(null)

  useEffect(() => {
    if (!mostrarCardTour) return
    estadoAntesDoTour.current = gruposAbertos
    const primeiroGrupo = grupos.find((grupo) => grupo.itens.length > 0)
    if (primeiroGrupo) {
      setGruposAbertos((atuais) => ({ ...atuais, [primeiroGrupo.id]: true }))
    }
    return () => {
      if (estadoAntesDoTour.current) setGruposAbertos(estadoAntesDoTour.current)
      estadoAntesDoTour.current = null
    }
  }, [mostrarCardTour])

  const handleToggle = useCallback((id: FaixaTempoId) => {
    setGruposAbertos((atuais) => ({ ...atuais, [id]: !atuais[id] }))
  }, [])

  return (
    <section className="flex h-full min-h-0 min-w-0 w-full max-w-full flex-col overflow-hidden rounded-2xl border border-border bg-secondary/55 shadow-sm">
      <div className={cn('flex shrink-0 items-center justify-between gap-2 rounded-t-2xl px-4 py-3', s.column)}>
        <h2 className="text-sm font-extrabold text-primary-foreground">{status}</h2>
        <span className="grid min-w-6 place-items-center rounded-full bg-primary-foreground/25 px-2 py-0.5 text-xs font-extrabold text-primary-foreground">
          {itens.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-0 min-w-0 flex-1 flex-col gap-2.5 overflow-x-hidden overflow-y-auto overscroll-contain p-3 transition',
          isOver && 'bg-primary/8 ring-2 ring-inset ring-primary/30',
        )}
      >
        {grupos
          .filter((grupo) => grupo.itens.length > 0)
          .map((grupo) => (
            <GrupoColuna
              key={grupo.id}
              grupo={grupo}
              aberto={gruposAbertos[grupo.id]}
              onToggle={handleToggle}
              onOpen={onOpen}
              onArchive={onArchive}
              readOnly={readOnly}
              responsaveisPorNome={responsaveisPorNome}
            />
          ))}
        {itens.length === 0 && (
          <p className="rounded-xl border-2 border-dashed border-border px-3 py-6 text-center text-xs font-semibold text-muted-foreground">
            Nenhum protocolo nesta etapa
          </p>
        )}
      </div>
    </section>
  )
})

export function KanbanBoard() {
  const router = useRouter()
  const { protocolos, carregado, erro } = useProtocolos()
  const [filtro, setFiltro] = useState('')
  const [filtroResp, setFiltroResp] = useState('')
  const [busca, setBusca] = useState('')
  const buscaAdiada = useDeferredValue(busca)
  const [responsaveis, setResponsaveis] = useState<ResponsavelAtribuivel[]>([])
  const [carregandoResponsaveis, setCarregandoResponsaveis] = useState(true)
  const [ativoId, setAtivoId] = useState<string | null>(null)
  const [movimentoPendente, setMovimentoPendente] = useState<{
    id: string
    destino: Status
    nome: string
  } | null>(null)
  const [arquivarId, setArquivarId] = useState<string | null>(null)
  const [tourAtivo, setTourAtivo] = useState(false)
  const readOnly = isCoordinator(cargoAtual())
  const passosTutorial = readOnly
    ? PASSOS_TUTORIAL.filter((passo) => passo.animacao !== 'arrastar')
    : PASSOS_TUTORIAL

  useEffect(() => {
    let ativo = true
    async function carregarResponsaveis() {
      setCarregandoResponsaveis(true)
      try {
        const resposta = await fetch('/api/admin/protocol-assignees', { cache: 'no-store' })
        const dados = await resposta.json().catch(() => null)
        if (!resposta.ok) {
          throw new Error(dados?.error ?? 'Nao foi possivel carregar responsaveis.')
        }
        if (ativo) setResponsaveis(Array.isArray(dados) ? dados : [])
      } catch {
        if (ativo) setResponsaveis([])
      } finally {
        if (ativo) setCarregandoResponsaveis(false)
      }
    }

    void carregarResponsaveis()
    return () => {
      ativo = false
    }
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  )

  const filtrados = useMemo(() => {
    const termo = buscaAdiada.trim().toLowerCase()
    const termoDigitos = soDigitos(buscaAdiada)
    return protocolos.filter((p) => {
      if (filtro && p.tipo !== filtro) return false
      if (filtroResp) {
        if (filtroResp === '__sem__' ? Boolean(p.responsavel) : p.responsavel !== filtroResp)
          return false
      }
      if (termo) {
        const casaNome = p.nome.toLowerCase().includes(termo)
        const casaNumero = p.numero.toLowerCase().includes(termo)
        const casaCpf = termoDigitos.length > 0 && p.cpf.includes(termoDigitos)
        if (!casaNome && !casaNumero && !casaCpf) return false
      }
      return true
    })
  }, [protocolos, filtro, filtroResp, buscaAdiada])

  const tiposDisponiveis = useMemo(() => {
    const tipos = new Set<string>()
    protocolos.forEach((p) => {
      if (p.tipo) tipos.add(p.tipo)
    })
    return Array.from(tipos).sort()
  }, [protocolos])

  const responsaveisDisponiveis = useMemo(() => {
    return responsaveis.map((responsavel) => responsavel.name).sort()
  }, [responsaveis])

  const responsaveisPorNome = useMemo(() => {
    return Object.fromEntries(
      responsaveis.map((responsavel) => [responsavel.name, responsavel.avatar_url]),
    )
  }, [responsaveis])

  const porStatus = useMemo(() => {
    const mapa = {} as Record<Status, Protocolo[]>
    STATUS_LIST.forEach((s) => {
      mapa[s] = []
    })
    filtrados.forEach((p) => mapa[p.status].push(p))
    STATUS_LIST.forEach((s) => {
      mapa[s].sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm))
    })
    return mapa
  }, [filtrados])
  const colunaTour = STATUS_LIST.find((status) => porStatus[status].length > 0)

  useEffect(() => {
    const usuario = usuarioAtual() ?? 'usuario'
    const chave = `epfil:tour-seen:${usuario}`
    const iniciar = () => {
      window.localStorage.removeItem('epfil:tour-requested')
      setTourAtivo(true)
    }
    if (window.localStorage.getItem('epfil:tour-requested') === 'true' || window.localStorage.getItem(chave) !== 'true') {
      iniciar()
    }
    window.addEventListener('epfil:start-tour', iniciar)
    return () => window.removeEventListener('epfil:start-tour', iniciar)
  }, [])

  const finalizarTour = useCallback(() => {
    const usuario = usuarioAtual() ?? 'usuario'
    window.localStorage.setItem(`epfil:tour-seen:${usuario}`, 'true')
    window.localStorage.removeItem('epfil:tour-requested')
    setTourAtivo(false)
  }, [])

  const ativo = protocolos.find((p) => p.id === ativoId) ?? null

  const handleStart = useCallback((e: DragStartEvent) => {
    setAtivoId(String(e.active.id))
  }, [])

  const handleEnd = useCallback((e: DragEndEvent) => {
    if (readOnly) return
    setAtivoId(null)
    const destino = e.over?.id
    if (!destino) return
    if (!STATUS_LIST.includes(destino as Status)) return
    const id = String(e.active.id)
    const alvo = protocolos.find((p) => p.id === id)
    if (!alvo || alvo.status === destino) return
    setMovimentoPendente({ id, destino: destino as Status, nome: alvo.nome })
  }, [protocolos, readOnly])

  const confirmarMovimento = useCallback(() => {
    if (!movimentoPendente) return
    if (readOnly) {
      setMovimentoPendente(null)
      return
    }
    void moverStatusRemoto(movimentoPendente.id, movimentoPendente.destino)
      .then(() => toast(`Etapa atualizada e e-mail enviado a ${movimentoPendente.nome}.`))
      .catch((error) =>
        toast(error instanceof Error ? error.message : 'Nao foi possivel atualizar o protocolo.'),
      )
    setMovimentoPendente(null)
  }, [movimentoPendente, readOnly])

  const handleOpen = useCallback(
    (id: string) => router.push(`/admin/protocolos/${encodeURIComponent(id)}`),
    [router],
  )

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden">
      <PageHeader
        titulo="Esteira de protocolos"
        descricao={readOnly ? 'Consulte os protocolos e seus detalhes.' : 'Arraste os cards entre as etapas. Cada movimentação gera automaticamente um registro no histórico e uma notificação ao solicitante.'}
      >
        <Link
          href="/admin/protocolos/arquivados"
          className="rounded-full border border-border bg-card px-3.5 py-2.5 text-xs font-extrabold text-muted-foreground transition hover:border-primary/40 hover:text-primary"
        >
          Arquivados
        </Link>
      </PageHeader>

      <div className="shrink-0 border-b border-border bg-background px-6 py-4 lg:px-8">
        <div className="flex flex-wrap items-end gap-3">
          <div data-tour="protocol-search" className="grid min-w-64 flex-1 gap-1.5">
            <label
              htmlFor="busca"
              className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground"
            >
              Buscar
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <TextInput
                id="busca"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Nome, CPF ou número do protocolo"
                className="pl-10"
              />
            </div>
          </div>

          <div data-tour="protocol-filters" className="flex flex-wrap items-end gap-3">
          <div className="grid gap-1.5">
            <label
              htmlFor="filtro-tipo"
              className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground"
            >
              Tipo
            </label>
            <Select
              id="filtro-tipo"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full sm:w-52"
            >
              <option value="">Todos os tipos</option>
              {tiposDisponiveis.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid gap-1.5">
            <label
              htmlFor="filtro-resp"
              className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground"
            >
              Responsável
            </label>
            <Select
              id="filtro-resp"
              value={filtroResp}
              onChange={(e) => setFiltroResp(e.target.value)}
              className="w-full sm:w-52"
            >
              <option value="">Todos</option>
              <option value="__sem__">Sem responsável</option>
              {responsaveisDisponiveis.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
              {carregandoResponsaveis && (
                <option value="" disabled>
                  Carregando responsáveis...
                </option>
              )}
              {!carregandoResponsaveis && responsaveisDisponiveis.length === 0 && (
                <option value="" disabled>
                  Nenhum responsável disponível
                </option>
              )}
            </Select>
          </div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 px-6 py-6 lg:px-8">
        {!carregado ? (
          <p className="text-sm font-bold text-muted-foreground">Carregando protocolos…</p>
        ) : erro ? (
          <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/8 p-5 text-sm font-bold text-destructive">
            {erro}
          </div>
        ) : (
          <DndContext sensors={sensors} onDragStart={handleStart} onDragEnd={handleEnd}>
            <div data-tour="kanban-columns" className="grid h-full min-h-0 min-w-0 auto-rows-[32rem] grid-cols-1 gap-4 overflow-x-hidden overflow-y-auto pb-4 sm:grid-cols-2 lg:grid-cols-3 xl:auto-rows-fr xl:grid-cols-5 xl:overflow-y-hidden">
              {STATUS_LIST.map((s) => (
                <Coluna
                  key={s}
                  status={s}
                  itens={porStatus[s]}
                  onOpen={handleOpen}
                  onArchive={setArquivarId}
                  mostrarCardTour={tourAtivo && s === colunaTour}
                  readOnly={readOnly}
                  responsaveisPorNome={responsaveisPorNome}
                />
              ))}
            </div>

            <DragOverlay>
              {ativo ? <CardConteudo p={ativo} dragging responsaveisPorNome={responsaveisPorNome} /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
      <ConfirmacaoModal
        aberto={movimentoPendente !== null}
        titulo="Confirmar mudança de etapa?"
        descricao={`O protocolo será movido para “${movimentoPendente?.destino ?? ''}”.`}
        onCancelar={() => setMovimentoPendente(null)}
        onConfirmar={confirmarMovimento}
      />
      <TourGuiado aberto={tourAtivo} passos={passosTutorial} onFinalizar={finalizarTour} />
      <ConfirmacaoModal
        aberto={arquivarId !== null}
        titulo="Arquivar protocolo?"
        descricao="O protocolo sairá da esteira principal, mas todos os dados e o histórico serão preservados."
        textoConfirmar="Arquivar"
        onCancelar={() => setArquivarId(null)}
        onConfirmar={() => {
          if (!arquivarId) return
          if (readOnly) return
          void gerenciarProtocoloRemoto(arquivarId, 'archive').catch((error) =>
            toast(error instanceof Error ? error.message : 'Nao foi possivel arquivar o protocolo.'),
          )
          setArquivarId(null)
        }}
      />
    </div>
  )
}
