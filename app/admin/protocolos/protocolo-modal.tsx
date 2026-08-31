'use client'

import { useCallback, useEffect, useState } from 'react'
import { ArchiveRestore, ArrowLeft, CircleCheckBig, Download, EyeOff, Lock, Plus, RotateCcw, TriangleAlert } from 'lucide-react'
import {
  adicionarEntradaManual,
  adicionarNotaInterna,
  atribuirResponsavel,
  desarquivarProtocolo,
  estaAtrasado,
  formatarCPF,
  formatarData,
  moverStatus,
  prazoPrevisto,
  recusarRespostaExigencia,
  cargoAtual,
  usuarioAtual,
} from '@/lib/store'
import { isCoordinator } from '@/lib/auth-types'
import { baixarComprovantePDF } from '@/lib/gerar-comprovante-pdf'
import { obterPrazoDescricaoTipo, obterPrazoSlaTipo } from '@/lib/categorias'
import {
  MODELOS_RESPOSTA,
  STATUS_FINAIS,
  STATUS_LIST,
  type Anexo,
  type Protocolo,
  type Status,
} from '@/lib/types'
import { StatusBadge } from '@/components/status-badge'
import { Timeline } from '@/components/timeline'
import { UploadAnexos } from '@/components/anexos'
import { Select, TextArea } from '@/components/form-field'
import { notificarEmail } from '@/components/toast'
import { ConfirmacaoModal } from '@/components/confirmacao-modal'
import { TourGuiado, type TourStep } from '@/components/tour-guiado'

const PASSOS_DETALHES: TourStep[] = [
  { alvo: '[data-tour="detail-header"]', titulo: 'Detalhes do protocolo', texto: 'Esta página reúne todas as informações e ações de um protocolo.', posicao: 'bottom' },
  { alvo: '[data-tour="detail-identity"]', titulo: 'Identificação e situação', texto: 'Confira o número, a etapa atual e alertas importantes do protocolo.', posicao: 'bottom' },
  { alvo: '[data-tour="detail-data"]', titulo: 'Dados da solicitação', texto: 'Aqui estão os dados do solicitante, tipo do pedido e datas de movimentação.', posicao: 'bottom' },
  { alvo: '[data-tour="detail-controls"]', titulo: 'Gestão do protocolo', texto: 'Acompanhe o prazo, atribua um responsável e mova o protocolo de etapa.', posicao: 'bottom' },
  { alvo: '[data-tour="detail-history"]', titulo: 'Histórico completo', texto: 'Consulte todas as movimentações, mensagens e documentos anexados.', posicao: 'top' },
  { alvo: '[data-tour="detail-internal-notes"]', titulo: 'Notas internas', texto: 'Registre observações visíveis apenas para a equipe administrativa.', posicao: 'right' },
  { alvo: '[data-tour="detail-manual-update"]', titulo: 'Novo andamento', texto: 'Adicione mensagens e anexos que ficarão visíveis ao solicitante.', posicao: 'left' },
]

const PASSOS_DETALHES_ARQUIVADO = PASSOS_DETALHES.filter((passo) =>
  ['[data-tour="detail-header"]', '[data-tour="detail-identity"]', '[data-tour="detail-data"]', '[data-tour="detail-history"]'].includes(passo.alvo),
)

type ResponsavelAtribuivel = {
  id: string
  name: string
  email: string
  role: 'SECRETARY_ADMIN' | 'SECRETARY_OPERATOR'
}

type AcaoPendente =
  | { tipo: 'andamento' }
  | { tipo: 'nota' }
  | { tipo: 'status'; status: Status }
  | { tipo: 'responsavel'; responsavel: string }
  | { tipo: 'recusar' }
  | { tipo: 'desarquivar' }

export function ProtocoloDetalhes({
  protocolo,
  onVoltar,
}: {
  protocolo: Protocolo
  onVoltar: () => void
}) {
  const [mensagem, setMensagem] = useState('')
  const [anexos, setAnexos] = useState<Anexo[]>([])
  const [erro, setErro] = useState('')
  const [modelo, setModelo] = useState('')
  const [nota, setNota] = useState('')
  const [acaoPendente, setAcaoPendente] = useState<AcaoPendente | null>(null)
  const [responsaveis, setResponsaveis] = useState<ResponsavelAtribuivel[]>([])
  const [carregandoResponsaveis, setCarregandoResponsaveis] = useState(true)
  const [tourAtivo, setTourAtivo] = useState(false)

  useEffect(() => {
    const usuario = usuarioAtual() ?? 'usuario'
    const tipo = protocolo.arquivado ? 'archived-details' : 'protocol-details'
    const chave = `epfil:tour-seen:${tipo}:${usuario}`
    const iniciar = () => setTourAtivo(true)
    if (window.localStorage.getItem(chave) !== 'true') iniciar()
    window.addEventListener('epfil:start-tour', iniciar)
    return () => window.removeEventListener('epfil:start-tour', iniciar)
  }, [protocolo.arquivado])

  useEffect(() => {
    let ativo = true
    async function carregarResponsaveis() {
      if (isCoordinator(cargoAtual())) {
        setCarregandoResponsaveis(false)
        return
      }

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

  const finalizarTour = useCallback(() => {
    const usuario = usuarioAtual() ?? 'usuario'
    const tipo = protocolo.arquivado ? 'archived-details' : 'protocol-details'
    window.localStorage.setItem(`epfil:tour-seen:${tipo}:${usuario}`, 'true')
    setTourAtivo(false)
  }, [protocolo.arquivado])

  function handleAdicionar() {
    if (!mensagem.trim()) {
      setErro('Escreva a mensagem do andamento.')
      return
    }
    setErro('')
    setAcaoPendente({ tipo: 'andamento' })
  }

  function handleModelo(valor: string) {
    setModelo(valor)
    if (valor) setMensagem(valor)
  }

  function handleStatus(novo: Status) {
    if (novo === protocolo.status) return
    setAcaoPendente({ tipo: 'status', status: novo })
  }

  function handleNota() {
    if (!nota.trim()) return
    setAcaoPendente({ tipo: 'nota' })
  }

  function handleRecusarExigencia() {
    setAcaoPendente({ tipo: 'recusar' })
  }

  function executarAcao(motivo: string) {
    if (!acaoPendente) return
    if (coordenador && acaoPendente.tipo !== 'nota') {
      setAcaoPendente(null)
      return
    }
    const autor = usuarioAtual()
    const nomeAutor = autor ? `Secretaria — ${autor}` : 'Secretaria'

    if (acaoPendente.tipo === 'andamento') {
      adicionarEntradaManual(protocolo.id, mensagem, anexos, nomeAutor)
      setMensagem('')
      setAnexos([])
      setModelo('')
      notificarEmail(protocolo.nome)
    } else if (acaoPendente.tipo === 'nota') {
      adicionarNotaInterna(protocolo.id, nota, autor ?? 'Secretaria')
      setNota('')
    } else if (acaoPendente.tipo === 'status') {
      moverStatus(protocolo.id, acaoPendente.status)
      notificarEmail(protocolo.nome)
    } else if (acaoPendente.tipo === 'responsavel') {
      atribuirResponsavel(protocolo.id, acaoPendente.responsavel)
    } else if (acaoPendente.tipo === 'desarquivar') {
      desarquivarProtocolo(protocolo.id, autor ?? 'Secretaria')
    } else {
      recusarRespostaExigencia(protocolo.id, motivo, nomeAutor)
      notificarEmail(protocolo.nome)
    }
    setAcaoPendente(null)
  }

  const atrasado = estaAtrasado(protocolo)
  const prazo = prazoPrevisto(protocolo)
  const notas = protocolo.notasInternas ?? []
  const coordenador = isCoordinator(cargoAtual())
  const responsavelAtualForaDaLista =
    protocolo.responsavel &&
    !responsaveis.some((responsavel) => responsavel.name === protocolo.responsavel)

  return (
    <section className="flex h-dvh min-h-0 flex-col overflow-hidden bg-background">
        <header data-tour="detail-header" className="shrink-0 border-b border-border bg-card px-6 py-6 lg:px-8">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={onVoltar}
              aria-label="Voltar para a esteira de protocolos"
              className="mt-1 inline-flex shrink-0 items-center gap-2 text-sm font-bold text-muted-foreground transition hover:text-primary focus-visible:rounded focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              <span>Voltar à esteira de protocolos</span>
            </button>
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                Detalhes do protocolo
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Consulte os dados da solicitação, acompanhe o histórico e registre novos
                andamentos.
              </p>
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6">
          <div data-tour="detail-identity" className="mx-4 mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-6 py-4 shadow-sm lg:mx-8">
            <div className="mr-3 min-w-0 flex-1 basis-64">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Protocolo
              </p>
              <p className="font-mono text-xl font-extrabold text-primary">{protocolo.numero}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => baixarComprovantePDF(protocolo)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-bold text-foreground transition hover:border-primary/40 hover:text-primary shadow-2xs"
                title="Baixar comprovante oficial de protocolo em PDF"
              >
                <Download className="size-3.5" aria-hidden="true" />
                <span>Baixar comprovante PDF</span>
              </button>
              <StatusBadge status={protocolo.status} />
              {protocolo.status === 'Com exigência' &&
                protocolo.subetapaExigencia === 'respondida' && (
                  <span className="rounded-full border border-[#B7791F]/40 bg-[#B7791F]/12 px-2.5 py-1 text-xs font-extrabold text-[#79500F]">
                    Aguardando conferência
                  </span>
                )}
              {atrasado && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/12 px-2.5 py-1 text-xs font-extrabold text-destructive">
                  <TriangleAlert className="size-3.5" aria-hidden="true" />
                  Atrasado
                </span>
              )}
            </div>
          </div>

          <dl data-tour="detail-data" className="mx-4 mt-4 grid gap-px overflow-hidden rounded-xl border border-border bg-border shadow-sm sm:grid-cols-3 lg:mx-8">
            {[
              ['Solicitante', protocolo.nome],
              ['CPF', formatarCPF(protocolo.cpf)],
              ['E-mail', protocolo.email],
              ['Categoria', protocolo.categoria],
              ['Tipo de solicitação', protocolo.tipo],
              ['Aberto em', formatarData(protocolo.criadoEm)],
              ['Última movimentação', formatarData(protocolo.atualizadoEm)],
            ].map(([k, v]) => (
              <div
                key={k}
                className={cnDetalhe(k === 'Última movimentação')}
              >
                <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {k}
                </dt>
                <dd className="mt-0.5 text-sm font-semibold break-words text-foreground">{v}</dd>
              </div>
            ))}
          </dl>

          {/* Controles administrativos */}
          {!protocolo.arquivado ? (
          <div data-tour="detail-controls" className={`mx-4 mt-4 grid gap-px overflow-hidden rounded-xl border border-border bg-border shadow-sm ${coordenador ? 'md:grid-cols-1' : 'md:grid-cols-3'} lg:mx-8`}>
            <div className="bg-card px-6 py-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Previsão de retorno
              </p>
              <p className={cnPrazo(atrasado)}>
                {prazo ? formatarData(prazo.toISOString()) : 'Sem previsão calculada'}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {prazo
                  ? `${obterPrazoSlaTipo(protocolo.tipo)} dias úteis · ${
                      STATUS_FINAIS.includes(protocolo.status)
                        ? 'protocolo concluído'
                        : atrasado
                          ? 'prazo estourado'
                          : 'dentro do prazo'
                    }`
                  : obterPrazoDescricaoTipo(protocolo.tipo) ??
                    'Prazo não especificado em fonte oficial'}
              </p>
            </div>
            {!coordenador && (
              <>
                <div className="bg-card px-6 py-4">
                  <label
                    htmlFor="responsavel"
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Responsável
                  </label>
                  <Select
                    id="responsavel"
                    value={protocolo.responsavel ?? ''}
                    onChange={(e) =>
                      setAcaoPendente({ tipo: 'responsavel', responsavel: e.target.value })
                    }
                    className="mt-1.5 py-2 text-sm"
                  >
                    <option value="">
                      {carregandoResponsaveis ? 'Carregando responsáveis...' : 'Sem responsável'}
                    </option>
                    {responsavelAtualForaDaLista && (
                      <option value={protocolo.responsavel}>
                        {protocolo.responsavel} (fora da lista atual)
                      </option>
                    )}
                    {responsaveis.map((responsavel) => (
                      <option key={responsavel.id} value={responsavel.name}>
                        {responsavel.name}
                      </option>
                    ))}
                    {!carregandoResponsaveis && responsaveis.length === 0 && (
                      <option value="" disabled>
                        Nenhum responsável disponível
                      </option>
                    )}
                  </Select>
                </div>
                <div className="bg-card px-6 py-4">
                  <label
                    htmlFor="mover-status"
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Mover etapa
                  </label>
                  <Select
                    id="mover-status"
                    value={protocolo.status}
                    onChange={(e) => handleStatus(e.target.value as Status)}
                    className="mt-1.5 py-2 text-sm"
                  >
                    {STATUS_LIST.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </div>
              </>
            )}
          </div>
          ) : (
            <div className="mx-4 mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-border bg-secondary/40 px-6 py-4 shadow-sm lg:mx-8">
              <div className="min-w-0 flex-1 basis-72">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Protocolo arquivado</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {protocolo.arquivadoEm ? formatarData(protocolo.arquivadoEm) : 'Data não informada'} · {protocolo.arquivadoPor ?? 'Responsável não informado'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Esta visualização é somente leitura.</p>
              </div>
              {!coordenador && (
                <button type="button" onClick={() => setAcaoPendente({ tipo: 'desarquivar' })} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-extrabold text-primary-foreground hover:opacity-90">
                  <ArchiveRestore className="size-4" aria-hidden="true" />
                  Desarquivar
                </button>
              )}
            </div>
          )}

          {protocolo.status === 'Com exigência' &&
            protocolo.subetapaExigencia === 'respondida' && (
              <div className="mx-4 mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-[#B7791F]/40 bg-[#B7791F]/8 px-6 py-4 shadow-sm lg:mx-8">
                <div className="min-w-0 flex-1 basis-72">
                  <h3 className="text-sm font-extrabold text-foreground">
                    Documento aguardando conferência
                  </h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    Confira o anexo no histórico e aprove para retomar a tramitação ou solicite uma
                    nova correção ao aluno.
                  </p>
                </div>
                {!coordenador && (
                  <>
                    <button
                      type="button"
                      onClick={handleRecusarExigencia}
                      className="inline-flex items-center gap-2 rounded-full border border-[#B7791F]/55 bg-card px-4 py-2.5 text-xs font-extrabold text-[#79500F] transition hover:bg-[#B7791F]/10"
                    >
                      <RotateCcw className="size-4" aria-hidden="true" />
                      Solicitar correção
                    </button>
                    <button
                      type="button"
                      onClick={() => setAcaoPendente({ tipo: 'status', status: 'Em tramitação' })}
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-extrabold text-primary-foreground transition hover:opacity-90"
                    >
                      <CircleCheckBig className="size-4" aria-hidden="true" />
                      Aprovar documento
                    </button>
                  </>
                )}
              </div>
            )}

          {protocolo.resumo && (
            <div className="mx-4 mt-4 rounded-xl border border-border bg-card px-6 py-4 shadow-sm lg:mx-8">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Resumo enviado
              </p>
              <p className="mt-1 text-sm leading-relaxed text-foreground">{protocolo.resumo}</p>
            </div>
          )}

          <div data-tour="detail-history" className="mx-4 mt-4 rounded-xl border border-border bg-card px-6 py-5 shadow-sm lg:mx-8">
            <h3 className="mb-4 text-base font-extrabold text-foreground">
              Histórico de andamento
            </h3>
            <Timeline historico={protocolo.historico} />
          </div>

          {(!protocolo.arquivado || coordenador) && (
          <div className={`mx-4 mt-4 grid items-stretch gap-4 ${coordenador ? 'xl:grid-cols-1' : 'xl:grid-cols-2'} lg:mx-8`}>
          {/* Notas internas — visíveis apenas para a equipe */}
          <div data-tour="detail-internal-notes" className="flex h-full flex-col rounded-xl border border-border bg-card px-6 py-5 shadow-sm xl:h-[36rem]">
            <div className="min-h-20">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-extrabold text-foreground">Notas internas</h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#79500f]">
                  <Lock className="size-3" aria-hidden="true" />
                  Uso interno
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Registre observações exclusivas da equipe que não aparecem na consulta pública.
              </p>
              <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <EyeOff className="size-3" aria-hidden="true" />
                Não aparece na consulta pública
              </span>
            </div>

            {notas.length > 0 ? (
              <ul
                className={notas.length >= 2
                  ? 'mt-4 grid h-28 shrink-0 gap-2.5 overflow-y-auto overscroll-contain pr-1'
                  : 'mt-4 grid gap-2.5'}
              >
                {notas
                  .slice()
                  .reverse()
                  .map((n) => (
                    <li
                      key={n.id}
                      className="rounded-xl border border-dashed border-accent/50 bg-card px-4 py-3"
                    >
                      <p className="text-sm leading-relaxed text-foreground">{n.mensagem}</p>
                      <p className="mt-1.5 text-xs font-semibold text-muted-foreground">
                        {n.autor} · {formatarData(n.data)}
                      </p>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs font-semibold text-muted-foreground">
                Nenhuma nota interna registrada. Use este espaço para observações da equipe.
              </p>
            )}

            <div className="mt-auto flex min-h-0 flex-1 flex-col gap-3 pt-4">
              <TextArea
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Ex.: Confirmar com a coordenação se o histórico do aluno já foi validado."
                aria-label="Nova nota interna"
                className="min-h-40 flex-1 bg-card"
              />
              <button
                type="button"
                onClick={handleNota}
                className="mt-auto flex w-full shrink-0 items-center gap-3 rounded-xl bg-accent px-3 py-2.5 text-left text-accent-foreground shadow-sm transition hover:brightness-95"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-foreground/10">
                  <Plus className="size-4" aria-hidden="true" />
                </span>
                <span className="text-sm font-extrabold">Adicionar nota interna</span>
              </button>
            </div>
          </div>

          {!coordenador && (
          <div data-tour="detail-manual-update" className="flex h-full flex-col rounded-xl border border-border bg-card px-6 py-5 shadow-sm xl:h-[36rem]">
            <div className="min-h-20">
              <h3 className="text-base font-extrabold text-foreground">
                Adicionar andamento manual
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                A mensagem e os anexos ficam visíveis ao solicitante na consulta pública, sem
                alterar a etapa atual. Uma notificação de e-mail é simulada ao salvar.
              </p>
            </div>

            <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3">
              <div className="grid gap-1.5">
                <label
                  htmlFor="modelo-resposta"
                  className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground"
                >
                  Modelos de resposta
                </label>
                <Select
                  id="modelo-resposta"
                  value={modelo}
                  onChange={(e) => handleModelo(e.target.value)}
                  className="py-2 text-sm"
                >
                  <option value="">Selecione um modelo (opcional)…</option>
                  {MODELOS_RESPOSTA.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Select>
              </div>
              <TextArea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Ex.: Falta o comprovante de matrícula do semestre anterior. Prazo de 10 dias para envio."
                aria-label="Mensagem do andamento"
                className="min-h-40"
              />
              <UploadAnexos anexos={anexos} onChange={setAnexos} compact />
              {erro && (
                <p role="alert" className="text-xs font-bold text-destructive">
                  {erro}
                </p>
              )}
              <button
                type="button"
                onClick={handleAdicionar}
                className="mt-auto flex w-full shrink-0 items-center gap-3 rounded-xl bg-primary px-3 py-2.5 text-left text-primary-foreground shadow-sm transition hover:opacity-90"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-foreground/15">
                  <Plus className="size-4" aria-hidden="true" />
                </span>
                <span className="text-sm font-extrabold">Adicionar ao histórico</span>
              </button>
            </div>
          </div>
          )}
          </div>
          )}
        </div>
        <ConfirmacaoModal
          aberto={acaoPendente !== null}
          titulo={tituloConfirmacao(acaoPendente)}
          descricao={descricaoConfirmacao(acaoPendente)}
          textoConfirmar={acaoPendente?.tipo === 'recusar' ? 'Solicitar correção' : acaoPendente?.tipo === 'desarquivar' ? 'Desarquivar' : 'Confirmar ação'}
          exigirMotivo={acaoPendente?.tipo === 'recusar'}
          labelMotivo="Motivo da correção"
          placeholderMotivo="Explique o que está incorreto ou qual documento deve ser reenviado."
          onCancelar={() => setAcaoPendente(null)}
          onConfirmar={executarAcao}
        />
        <TourGuiado
          aberto={tourAtivo}
          passos={protocolo.arquivado ? PASSOS_DETALHES_ARQUIVADO : PASSOS_DETALHES}
          onFinalizar={finalizarTour}
        />
    </section>
  )
}

function cnPrazo(atrasado: boolean) {
  return `mt-0.5 text-sm font-extrabold ${atrasado ? 'text-destructive' : 'text-foreground'}`
}

function cnDetalhe(linhaInteira: boolean) {
  return `bg-card px-6 py-3.5 ${linhaInteira ? 'sm:col-span-3' : ''}`
}

function tituloConfirmacao(acao: AcaoPendente | null) {
  if (acao?.tipo === 'recusar') return 'Solicitar correção do documento?'
  if (acao?.tipo === 'status') return 'Confirmar mudança de etapa?'
  if (acao?.tipo === 'responsavel') return 'Confirmar alteração de responsável?'
  if (acao?.tipo === 'desarquivar') return 'Desarquivar protocolo?'
  if (acao?.tipo === 'nota') return 'Adicionar nota interna?'
  return 'Adicionar andamento ao histórico?'
}

function descricaoConfirmacao(acao: AcaoPendente | null) {
  if (acao?.tipo === 'recusar') return 'O aluno será notificado e deverá enviar uma nova documentação.'
  if (acao?.tipo === 'status') return `O protocolo será movido para “${acao.status}”.`
  if (acao?.tipo === 'responsavel') return `O responsável será alterado para “${acao.responsavel || 'Sem responsável'}”.`
  if (acao?.tipo === 'desarquivar') return 'O protocolo voltará para a coluna correspondente à sua última etapa.'
  if (acao?.tipo === 'nota') return 'A nota ficará visível somente para a equipe administrativa.'
  return 'O andamento será registrado e ficará visível ao solicitante.'
}
