'use client'

import categoriasIniciais from '@/data/categorias-solicitacoes.json'
import categoriasDemo from '@/data/categorias-demo.json'

export type DocumentoExigido = {
  id: string
  nome: string
  obrigatorio: boolean
  formatosAceitos: string[]
  tamanhoMaximoMB: number
  descricao?: string
}

export type TipoSolicitacaoItem = {
  id: string
  nome: string
  descricao?: string
  prazoDias?: number
  prazoDescricao?: string
  documentosExigidos?: DocumentoExigido[]
}

export type CategoriaItem = {
  id: string
  nome: string
  descricao: string
  tiposSolicitacao: TipoSolicitacaoItem[]
}

export const CATEGORIAS_STORAGE_KEY = 'epfil:categorias:v2'
export const CATEGORIAS_PADRAO: CategoriaItem[] = categoriasIniciais as CategoriaItem[]
export const CATEGORIAS_DEMO: CategoriaItem[] = categoriasDemo as CategoriaItem[]

const LISTENERS = new Set<() => void>()
let categoriasCache: CategoriaItem[] | null = null
let storageCache: string | null = null

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

function emit() {
  LISTENERS.forEach((l) => l())
}

export function subscribeCategorias(listener: () => void) {
  LISTENERS.add(listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key === CATEGORIAS_STORAGE_KEY) {
      categoriasCache = null
      storageCache = null
      listener()
    }
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage)
  }
  return () => {
    LISTENERS.delete(listener)
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', onStorage)
    }
  }
}

export function lerCategorias(): CategoriaItem[] {
  if (typeof window === 'undefined') return CATEGORIAS_PADRAO
  try {
    const raw = window.localStorage.getItem(CATEGORIAS_STORAGE_KEY)
    if (!raw) {
      if (categoriasCache) return categoriasCache
      try {
        const serializado = JSON.stringify(CATEGORIAS_PADRAO)
        window.localStorage.setItem(CATEGORIAS_STORAGE_KEY, serializado)
        storageCache = serializado
      } catch (e) {
        console.warn('[Storage] Não foi possível salvar categorias no localStorage.', e)
      }
      categoriasCache = CATEGORIAS_PADRAO
      return CATEGORIAS_PADRAO
    }
    if (categoriasCache && raw === storageCache) return categoriasCache
    const parsed = JSON.parse(raw)
    categoriasCache = Array.isArray(parsed) ? (parsed as CategoriaItem[]) : CATEGORIAS_PADRAO
    storageCache = raw
    return categoriasCache
  } catch (err) {
    console.error('[Storage] Erro ao ler categorias:', err)
    return CATEGORIAS_PADRAO
  }
}

export function salvarCategorias(lista: CategoriaItem[]) {
  if (typeof window === 'undefined') return
  try {
    const serializado = JSON.stringify(lista)
    window.localStorage.setItem(CATEGORIAS_STORAGE_KEY, serializado)
    categoriasCache = lista
    storageCache = serializado
  } catch (e) {
    console.error('[Storage] Erro ao salvar categorias:', e)
    categoriasCache = lista
  }
  emit()
}

export function criarCategoria(dados: {
  nome: string
  descricao: string
  tiposSolicitacao?: TipoSolicitacaoItem[]
}): CategoriaItem {
  const lista = lerCategorias()
  const idBase = slugify(dados.nome) || 'categoria'
  let idFinal = idBase
  let contador = 1
  while (lista.some((c) => c.id === idFinal)) {
    idFinal = `${idBase}-${contador++}`
  }

  const nova: CategoriaItem = {
    id: idFinal,
    nome: dados.nome.trim(),
    descricao: dados.descricao.trim(),
    tiposSolicitacao: dados.tiposSolicitacao ?? [],
  }

  salvarCategorias([...lista, nova])
  return nova
}

export function editarCategoria(
  id: string,
  dados: {
    nome?: string
    descricao?: string
    tiposSolicitacao?: TipoSolicitacaoItem[]
  },
): CategoriaItem | null {
  const lista = lerCategorias()
  let categoriaAtualizada: CategoriaItem | null = null

  const novaLista = lista.map((c) => {
    if (c.id !== id) return c
    categoriaAtualizada = {
      ...c,
      nome: dados.nome !== undefined ? dados.nome.trim() : c.nome,
      descricao: dados.descricao !== undefined ? dados.descricao.trim() : c.descricao,
      tiposSolicitacao:
        dados.tiposSolicitacao !== undefined ? dados.tiposSolicitacao : c.tiposSolicitacao,
    }
    return categoriaAtualizada
  })

  if (categoriaAtualizada) {
    salvarCategorias(novaLista)
  }

  return categoriaAtualizada
}

export function deletarCategoria(id: string): boolean {
  const lista = lerCategorias()
  const filtrada = lista.filter((c) => c.id !== id)
  if (filtrada.length === lista.length) return false
  salvarCategorias(filtrada)
  return true
}

export function adicionarTipoSolicitacao(
  categoriaId: string,
  tipo: {
    nome: string
    descricao?: string
    prazoDias?: number
    prazoDescricao?: string
    documentosExigidos?: DocumentoExigido[]
  },
): TipoSolicitacaoItem | null {
  const lista = lerCategorias()
  const categoria = lista.find((c) => c.id === categoriaId)
  if (!categoria) return null

  const idBase = slugify(tipo.nome) || 'tipo'
  let idFinal = idBase
  let contador = 1
  while (categoria.tiposSolicitacao.some((t) => t.id === idFinal)) {
    idFinal = `${idBase}-${contador++}`
  }

  const novoTipo: TipoSolicitacaoItem = {
    id: idFinal,
    nome: tipo.nome.trim(),
    descricao: tipo.descricao?.trim() || undefined,
    prazoDias: tipo.prazoDias,
    prazoDescricao: tipo.prazoDescricao?.trim() || undefined,
    documentosExigidos: tipo.documentosExigidos ?? [],
  }

  editarCategoria(categoriaId, {
    tiposSolicitacao: [...categoria.tiposSolicitacao, novoTipo],
  })

  return novoTipo
}

export function editarTipoSolicitacao(
  categoriaId: string,
  tipoId: string,
  dados: {
    nome?: string
    descricao?: string
    prazoDias?: number | null
    prazoDescricao?: string
    documentosExigidos?: DocumentoExigido[]
  },
): TipoSolicitacaoItem | null {
  const lista = lerCategorias()
  const categoria = lista.find((c) => c.id === categoriaId)
  if (!categoria) return null

  let tipoAtualizado: TipoSolicitacaoItem | null = null

  const novosTipos = categoria.tiposSolicitacao.map((t) => {
    if (t.id !== tipoId) return t
    tipoAtualizado = {
      ...t,
      nome: dados.nome !== undefined ? dados.nome.trim() : t.nome,
      descricao: dados.descricao !== undefined ? dados.descricao.trim() : t.descricao,
      prazoDias:
        dados.prazoDias === null
          ? undefined
          : dados.prazoDias !== undefined
            ? dados.prazoDias
            : t.prazoDias,
      prazoDescricao:
        dados.prazoDescricao !== undefined ? dados.prazoDescricao.trim() : t.prazoDescricao,
      documentosExigidos:
        dados.documentosExigidos !== undefined
          ? dados.documentosExigidos
          : t.documentosExigidos,
    }
    return tipoAtualizado
  })

  if (tipoAtualizado) {
    editarCategoria(categoriaId, { tiposSolicitacao: novosTipos })
  }

  return tipoAtualizado
}

export function deletarTipoSolicitacao(categoriaId: string, tipoId: string): boolean {
  const lista = lerCategorias()
  const categoria = lista.find((c) => c.id === categoriaId)
  if (!categoria) return false

  const novosTipos = categoria.tiposSolicitacao.filter((t) => t.id !== tipoId)
  if (novosTipos.length === categoria.tiposSolicitacao.length) return false

  editarCategoria(categoriaId, { tiposSolicitacao: novosTipos })
  return true
}

export function restaurarCategoriasPadrao(): CategoriaItem[] {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(CATEGORIAS_STORAGE_KEY)
  }
  categoriasCache = null
  storageCache = null
  const resetadas = lerCategorias()
  emit()
  return resetadas
}

export function restaurarCategoriasDemo(): CategoriaItem[] {
  if (typeof window === 'undefined') return CATEGORIAS_DEMO
  salvarCategorias(CATEGORIAS_DEMO)
  return CATEGORIAS_DEMO
}

export function obterTiposPorCategoria(categoriaNomeOuId: string): TipoSolicitacaoItem[] {
  if (!categoriaNomeOuId) return []
  const lista = lerCategorias()
  const cat = lista.find(
    (c) =>
      c.id.toLowerCase() === categoriaNomeOuId.toLowerCase() ||
      c.nome.toLowerCase() === categoriaNomeOuId.toLowerCase(),
  )
  return cat?.tiposSolicitacao ?? []
}

export function obterPrazoSlaTipo(tipoNomeOuId: string): number | undefined {
  const lista = lerCategorias()
  for (const cat of lista) {
    const t = cat.tiposSolicitacao.find(
      (item) =>
        item.id.toLowerCase() === tipoNomeOuId.toLowerCase() ||
        item.nome.toLowerCase() === tipoNomeOuId.toLowerCase(),
    )
    if (t?.prazoDias) return t.prazoDias
  }
  return undefined
}

export function obterPrazoDescricaoTipo(tipoNomeOuId: string): string | undefined {
  const lista = lerCategorias()
  for (const cat of lista) {
    const tipo = cat.tiposSolicitacao.find(
      (item) =>
        item.id.toLowerCase() === tipoNomeOuId.toLowerCase() ||
        item.nome.toLowerCase() === tipoNomeOuId.toLowerCase(),
    )
    if (tipo) return tipo.prazoDescricao
  }
  return undefined
}
