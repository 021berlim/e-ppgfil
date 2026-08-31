'use client'

import type {
  Anexo,
  Categoria,
  EntradaHistorico,
  NotaInterna,
  Protocolo,
  RegistroAuditoria,
  Status,
  TipoSolicitacao,
} from './types'
import type { ClientSession, DashboardRole } from './auth-types'
import { RESPONSAVEIS, STATUS_FINAIS } from './types'
import { obterPrazoSlaTipo } from './categorias'

export const STORAGE_KEY = 'epfil:protocolos'
export const AUTH_KEY = 'epfil:auth'
export const ARQUIVAMENTO_AUTOMATICO_DIAS = 90

const LISTENERS = new Set<() => void>()
let protocolosCache: Protocolo[] | null = null
let storageCache: string | null = null

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

export function formatarCPF(cpf: string) {
  const d = cpf.replace(/\D/g, '').slice(0, 11)
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})$/, '$1.$2.$3-$4')
}

export function soDigitos(v: string) {
  return v.replace(/\D/g, '')
}

export function formatarData(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatarDataCurta(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  })
}

/* ----- Prazo / SLA em dias úteis ----- */

export function adicionarDiasUteis(base: Date, dias: number): Date {
  const d = new Date(base)
  let restantes = dias
  while (restantes > 0) {
    d.setDate(d.getDate() + 1)
    const diaSemana = d.getDay()
    if (diaSemana !== 0 && diaSemana !== 6) restantes--
  }
  return d
}

export function prazoPrevisto(p: Protocolo): Date | null {
  const dias = obterPrazoSlaTipo(p.tipo)
  return dias ? adicionarDiasUteis(new Date(p.criadoEm), dias) : null
}

export function estaAtrasado(p: Protocolo): boolean {
  if (STATUS_FINAIS.includes(p.status)) return false
  const prazo = prazoPrevisto(p)
  return prazo ? Date.now() > prazo.getTime() : false
}

export function formatarTamanho(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function gerarNumeroProtocolo(existentes: Protocolo[]) {
  const ano = new Date().getFullYear()
  const doAno = existentes.filter((p) => p.numero.includes(`/${ano}`)).length
  const seq = String(doAno + 1).padStart(6, '0')
  return `PPGFIL-${seq}/${ano}`
}

export function arquivoParaAnexo(file: File): Anexo {
  return { id: uid(), nome: file.name, tipo: file.type || 'arquivo', tamanho: file.size }
}

function diasAtras(dias: number, horas = 0) {
  const d = new Date()
  d.setDate(d.getDate() - dias)
  d.setHours(9 + horas, 30, 0, 0)
  return d.toISOString()
}

// Listas para sorteio aleatório em massa
const NOMES_MOCK = [
  'Ana Beatriz Moura Lima', 'Rafael Teixeira de Andrade', 'Helena Duarte Vasconcelos',
  'Lucas Ferreira Campos', 'Mariana Souza Albuquerque', 'Carlos Eduardo Silva',
  'Fernanda Oliveira Costa', 'Gabriel Santos Pereira', 'Juliana Alves Rodrigues',
  'Rodrigo Martins Ribeiro', 'Beatriz Lima Carvalho', 'Thiago Gomes Barbosa'
]

const CATEGORIAS_MOCK: Categoria[] = ['Discente', 'Docente', 'Candidato', 'Externo']
const TIPOS_MOCK: TipoSolicitacao[] = [
  'Matrícula', 'Trancamento', 'Aproveitamento de disciplina',
  'Solicitação de documento', 'Outros'
]
const STATUS_MOCK: Status[] = ['Gerado', 'Em tramitação', 'Com exigência', 'Deferido', 'Indeferido']

/**
 * Gera uma quantidade N de protocolos em memória para testes de stress/benchmarks.
 */
export function gerarMassaProtocolos(quantidade = 20000): Protocolo[] {
  const ano = new Date().getFullYear()
  const lista: Protocolo[] = new Array(quantidade)

  for (let i = 0; i < quantidade; i++) {
    const seq = String(i + 1).padStart(6, '0')
    const status = STATUS_MOCK[i % STATUS_MOCK.length]
    const cpfNum = String(10000000000 + (i % 89999999999))
    const dias = Math.floor(Math.random() * 60) + 1
    const dataCriacao = diasAtras(dias, i % 12)
    const finalizado = STATUS_FINAIS.includes(status)

    const historico: EntradaHistorico[] = [
      {
        id: uid(),
        data: dataCriacao,
        autor: 'Sistema',
        origem: 'sistema',
        status: 'Gerado',
        mensagem: 'Protocolo gerado e registrado na secretaria do PPGFIL.',
        anexos: i % 2 === 0 ? [{ id: uid(), nome: `documento-${i}.pdf`, tipo: 'application/pdf', tamanho: 150000 }] : [],
      },
    ]

    // Protocolos concluídos recebem uma data de conclusão realista (1 a 12 dias após a abertura),
    // permitindo calcular o tempo médio de conclusão no painel.
    let dataAtualizacao = dataCriacao
    if (finalizado) {
      const criado = new Date(dataCriacao)
      criado.setDate(criado.getDate() + ((i % 12) + 1))
      dataAtualizacao = criado.toISOString()
      historico.push({
        id: uid(),
        data: dataAtualizacao,
        autor: 'Sistema',
        origem: 'sistema',
        status,
        mensagem: `Processo movido para: ${status}`,
        anexos: [],
      })
    }

    lista[i] = {
      id: uid(),
      numero: `PPGFIL-${seq}/${ano}`,
      cpf: cpfNum,
      nome: NOMES_MOCK[i % NOMES_MOCK.length],
      email: `usuario${i}@exemplo.com`,
      categoria: CATEGORIAS_MOCK[i % CATEGORIAS_MOCK.length],
      tipo: TIPOS_MOCK[i % TIPOS_MOCK.length],
      resumo: `Solicitação automatizada em massa de teste número ${i + 1}.`,
      status,
      criadoEm: dataCriacao,
      atualizadoEm: dataAtualizacao,
      responsavel: i % 3 === 0 ? RESPONSAVEIS[i % RESPONSAVEIS.length] : undefined,
      notasInternas: [],
      historico,
    }
  }

  return lista
}

function seed(): Protocolo[] {
  return []
}

function emit() {
  LISTENERS.forEach((l) => l())
}

export function subscribe(listener: () => void) {
  LISTENERS.add(listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      protocolosCache = null
      storageCache = null
      listener()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    LISTENERS.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function lerProtocolos(): Protocolo[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      if (protocolosCache) return protocolosCache
      const inicial = seed()
      try {
        const serializado = JSON.stringify(inicial)
        window.localStorage.setItem(STORAGE_KEY, serializado)
        storageCache = serializado
      } catch (e) {
        console.warn('[Storage] Não foi possível salvar no localStorage (limite excedido). Mantendo em memória.', e)
      }
      protocolosCache = inicial
      return inicial
    }
    if (protocolosCache && raw === storageCache) return protocolosCache
    const parsed = JSON.parse(raw)
    protocolosCache = Array.isArray(parsed) ? (parsed as Protocolo[]) : []
    storageCache = raw
    return protocolosCache
  } catch (err) {
    console.log('[v0] erro ao ler protocolos:', err)
    return []
  }
}

export function lerAuditoria(): RegistroAuditoria[] {
  return lerProtocolos()
    .flatMap((protocolo) => [
      ...protocolo.historico.map((entrada) => ({
        id: `${protocolo.id}:${entrada.id}`,
        data: entrada.data,
        ator: entrada.autor,
        acao: entrada.status,
        categoria: 'protocolo' as const,
        protocoloNumero: protocolo.numero,
        detalhes: entrada.mensagem,
      })),
      ...(protocolo.notasInternas ?? []).map((nota) => ({
        id: `${protocolo.id}:nota:${nota.id}`,
        data: nota.data,
        ator: nota.autor,
        acao: 'Nota interna',
        categoria: 'protocolo' as const,
        protocoloNumero: protocolo.numero,
        detalhes: nota.mensagem,
      })),
    ])
    .sort((a, b) => b.data.localeCompare(a.data))
}

export const subscribeAuditoria = subscribe

function salvar(lista: Protocolo[]) {
  try {
    const serializado = JSON.stringify(lista)
    window.localStorage.setItem(STORAGE_KEY, serializado)
    protocolosCache = lista
    storageCache = serializado
  } catch (e) {
    console.error('[Storage] Erro ao salvar lista no localStorage:', e)
    protocolosCache = lista
  }
  emit()
}

export function criarProtocolo(dados: {
  cpf: string
  nome: string
  email: string
  categoria: Categoria
  tipo: TipoSolicitacao
  resumo: string
  anexos: Anexo[]
}): Protocolo {
  const lista = lerProtocolos()
  const agora = new Date().toISOString()
  const novo: Protocolo = {
    id: uid(),
    numero: gerarNumeroProtocolo(lista),
    cpf: soDigitos(dados.cpf),
    nome: dados.nome.trim(),
    email: dados.email.trim(),
    categoria: dados.categoria,
    tipo: dados.tipo,
    resumo: dados.resumo.trim(),
    status: 'Gerado',
    criadoEm: agora,
    atualizadoEm: agora,
    responsavel: undefined,
    notasInternas: [],
    historico: [
      {
        id: uid(),
        data: agora,
        autor: dados.nome.trim(),
        origem: 'solicitante',
        status: 'Gerado',
        mensagem: 'Protocolo criado pelo solicitante e registrado na secretaria do PPGFIL.',
        anexos: dados.anexos,
      },
    ],
  }
  salvar([novo, ...lista])
  return novo
}

export function atribuirResponsavel(id: string, responsavel: string, autor = 'Secretaria') {
  const lista = lerProtocolos()
  const agora = new Date().toISOString()
  salvar(
    lista.map((p) => {
      if (p.id !== id) return p
      const novoResponsavel = responsavel || undefined
      if (p.responsavel === novoResponsavel) return p
      const entrada: EntradaHistorico = {
        id: uid(),
        data: agora,
        autor,
        origem: 'secretaria',
        status: p.status,
        mensagem: `Responsável alterado de ${p.responsavel ?? 'Sem responsável'} para ${novoResponsavel ?? 'Sem responsável'}.`,
        anexos: [],
      }
      return {
        ...p,
        responsavel: novoResponsavel,
        atualizadoEm: agora,
        historico: [...p.historico, entrada],
      }
    }),
  )
}

export function adicionarNotaInterna(id: string, mensagem: string, autor = 'Secretaria') {
  const texto = mensagem.trim()
  if (!texto) return
  const lista = lerProtocolos()
  const agora = new Date().toISOString()
  salvar(
    lista.map((p) => {
      if (p.id !== id) return p
      const nota: NotaInterna = { id: uid(), data: agora, autor, mensagem: texto }
      return { ...p, notasInternas: [...(p.notasInternas ?? []), nota] }
    }),
  )
}

export function moverStatus(id: string, status: Status, autor = 'Secretaria') {
  const lista = lerProtocolos()
  const agora = new Date().toISOString()
  salvar(
    lista.map((p) => {
      if (p.id !== id || p.status === status) return p
      const entrada: EntradaHistorico = {
        id: uid(),
        data: agora,
        autor,
        origem: 'secretaria',
        status,
        mensagem: `Processo movido para: ${status}`,
        anexos: [],
      }
      return {
        ...p,
        status,
        subetapaExigencia: undefined,
        atualizadoEm: agora,
        historico: [...p.historico, entrada],
      }
    }),
  )
}

export function adicionarEntradaManual(
  id: string,
  mensagem: string,
  anexos: Anexo[],
  autor = 'Secretaria — Carla Nogueira',
) {
  const lista = lerProtocolos()
  const agora = new Date().toISOString()
  salvar(
    lista.map((p) => {
      if (p.id !== id) return p
      const entrada: EntradaHistorico = {
        id: uid(),
        data: agora,
        autor,
        origem: 'secretaria',
        status: p.status,
        mensagem: mensagem.trim(),
        anexos,
      }
      return { ...p, atualizadoEm: agora, historico: [...p.historico, entrada] }
    }),
  )
}

export function adicionarAnexosSolicitante(id: string, anexos: Anexo[]) {
  if (anexos.length === 0) return
  const lista = lerProtocolos()
  const agora = new Date().toISOString()
  salvar(
    lista.map((p) => {
      if (p.id !== id || p.status !== 'Com exigência') return p
      const entrada: EntradaHistorico = {
        id: uid(),
        data: agora,
        autor: p.nome,
        origem: 'solicitante',
        status: p.status,
        mensagem: `Documento enviado pelo solicitante (${anexos.length} anexo(s)).`,
        anexos,
      }
      return {
        ...p,
        subetapaExigencia: 'respondida',
        atualizadoEm: agora,
        historico: [...p.historico, entrada],
      }
    }),
  )
}

export function recusarRespostaExigencia(id: string, motivo: string, autor = 'Secretaria') {
  const justificativa = motivo.trim()
  if (!justificativa) return
  const lista = lerProtocolos()
  const agora = new Date().toISOString()
  salvar(
    lista.map((p) => {
      if (p.id !== id || p.status !== 'Com exigência' || p.subetapaExigencia !== 'respondida') {
        return p
      }
      const entrada: EntradaHistorico = {
        id: uid(),
        data: agora,
        autor,
        origem: 'secretaria',
        status: p.status,
        mensagem: `Documento recusado ou insuficiente. Motivo: ${justificativa}`,
        anexos: [],
      }
      return {
        ...p,
        subetapaExigencia: undefined,
        atualizadoEm: agora,
        historico: [...p.historico, entrada],
      }
    }),
  )
}

export function arquivarProtocolo(id: string, responsavel: string) {
  const lista = lerProtocolos()
  const agora = new Date().toISOString()
  salvar(
    lista.map((p) => {
      if (p.id !== id || p.arquivado || !STATUS_FINAIS.includes(p.status)) return p
      const entrada: EntradaHistorico = {
        id: uid(),
        data: agora,
        autor: responsavel,
        origem: 'secretaria',
        status: p.status,
        mensagem: `Protocolo arquivado por ${responsavel}`,
        anexos: [],
      }
      return {
        ...p,
        arquivado: true,
        arquivadoEm: agora,
        arquivadoPor: responsavel,
        historico: [...p.historico, entrada],
      }
    }),
  )
}

export function desarquivarProtocolo(id: string, responsavel: string) {
  const lista = lerProtocolos()
  const agora = new Date().toISOString()
  salvar(
    lista.map((p) => {
      if (p.id !== id || !p.arquivado) return p
      const entrada: EntradaHistorico = {
        id: uid(),
        data: agora,
        autor: responsavel,
        origem: 'secretaria',
        status: p.status,
        mensagem: `Protocolo desarquivado por ${responsavel}`,
        anexos: [],
      }
      return {
        ...p,
        arquivado: false,
        arquivadoEm: undefined,
        arquivadoPor: undefined,
        historico: [...p.historico, entrada],
      }
    }),
  )
}

/**
 * O protótipo não possui servidor/cron. Esta manutenção é executada ao abrir o admin
 * e periodicamente enquanto ele estiver aberto.
 */
export function arquivarFinalizadosAutomaticamente(dias = ARQUIVAMENTO_AUTOMATICO_DIAS) {
  const lista = lerProtocolos()
  const limite = Date.now() - dias * 86_400_000
  const agora = new Date().toISOString()
  let alterou = false

  const atualizada = lista.map((p) => {
    if (p.arquivado || !STATUS_FINAIS.includes(p.status)) return p
    const entradaFinal = [...p.historico].reverse().find((h) => STATUS_FINAIS.includes(h.status))
    const inicioFinal = new Date(entradaFinal?.data ?? p.atualizadoEm).getTime()
    if (!Number.isFinite(inicioFinal) || inicioFinal > limite) return p
    alterou = true
    const entrada: EntradaHistorico = {
      id: uid(),
      data: agora,
      autor: 'Sistema',
      origem: 'sistema',
      status: p.status,
      mensagem: `Arquivado automaticamente após ${dias} dias na etapa final`,
      anexos: [],
    }
    return {
      ...p,
      arquivado: true,
      arquivadoEm: agora,
      arquivadoPor: 'Sistema',
      historico: [...p.historico, entrada],
    }
  })

  if (alterou) salvar(atualizada)
}

export function consultarProtocolo(cpf: string, numero: string): Protocolo | null {
  const alvoCpf = soDigitos(cpf)
  const alvoNum = numero.trim().toUpperCase()
  const encontrado = lerProtocolos().find(
    (p) => p.cpf === alvoCpf && p.numero.toUpperCase() === alvoNum,
  )
  return encontrado ?? null
}

/* auth propria */
export function login(session: ClientSession | string) {
  const payload =
    typeof session === 'string'
      ? { email: session, role: 'SECRETARY_ADMIN' as DashboardRole, em: Date.now() }
      : session
  window.localStorage.setItem(AUTH_KEY, JSON.stringify(payload))
}

export function logout() {
  window.localStorage.removeItem(AUTH_KEY)
  void fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined)
}

export function usuarioAtualInfo(): ClientSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(AUTH_KEY)
    if (!raw) return null
    const sessao = JSON.parse(raw) as Partial<ClientSession> & { usuario?: string }
    const email = sessao.email ?? sessao.usuario
    if (!email) return null
    return {
      id: sessao.id,
      email,
      name: sessao.name,
      avatar_url: sessao.avatar_url ?? null,
      role: sessao.role ?? 'SECRETARY_ADMIN',
      em: sessao.em ?? Date.now(),
    }
  } catch {
    return null
  }
}

export function usuarioAtual(): string | null {
  return usuarioAtualInfo()?.email ?? null
}

export function nomeUsuarioAtual(): string | null {
  const sessao = usuarioAtualInfo()
  return sessao?.name || sessao?.email || null
}

export function cargoAtual(): DashboardRole | null {
  return usuarioAtualInfo()?.role ?? null
}
