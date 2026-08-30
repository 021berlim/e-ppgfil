'use client'

import { useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Clock,
  Edit2,
  FolderTree,
  Layers,
  Plus,
  RotateCcw,
  Search,
  Sliders,
  Tag,
  Trash2,
  X,
} from 'lucide-react'
import { PageHeader } from '@/components/admin-shell'
import { ConfirmacaoModal } from '@/components/confirmacao-modal'
import { Field, TextArea, TextInput } from '@/components/form-field'
import { toast } from '@/components/toast'
import { useCategorias } from '@/hooks/use-categorias'
import {
  adicionarTipoSolicitacao,
  criarCategoria,
  deletarCategoria,
  deletarTipoSolicitacao,
  editarCategoria,
  editarTipoSolicitacao,
  restaurarCategoriasPadrao,
  type CategoriaItem,
  type DocumentoExigido,
  type TipoSolicitacaoItem,
} from '@/lib/categorias'

function novoDocumentoExigido(): DocumentoExigido {
  return {
    id: `documento-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    nome: '',
    obrigatorio: true,
    formatosAceitos: ['pdf'],
    tamanhoMaximoMB: 10,
  }
}

const FORMATOS_DISPONIVEIS = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']

export function CategoriasManager() {
  const { categorias, carregado } = useCategorias()
  const [busca, setBusca] = useState('')

  // Modais de Categoria
  const [modalCategoriaAberta, setModalCategoriaAberta] = useState(false)
  const [categoriaEdicao, setCategoriaEdicao] = useState<CategoriaItem | null>(null)
  const [nomeCategoria, setNomeCategoria] = useState('')
  const [descCategoria, setDescCategoria] = useState('')
  const [erroCategoria, setErroCategoria] = useState('')

  // Modais de Tipo de Solicitação
  const [modalTipoAberta, setModalTipoAberta] = useState(false)
  const [categoriaAlvoTipo, setCategoriaAlvoTipo] = useState<CategoriaItem | null>(null)
  const [tipoEdicao, setTipoEdicao] = useState<TipoSolicitacaoItem | null>(null)
  const [nomeTipo, setNomeTipo] = useState('')
  const [descTipo, setDescTipo] = useState('')
  const [prazoDias, setPrazoDias] = useState(7)
  const [documentosExigidos, setDocumentosExigidos] = useState<DocumentoExigido[]>([])
  const [erroTipo, setErroTipo] = useState('')

  // Modais de Exclusão e Confirmação
  const [categoriaParaExcluir, setCategoriaParaExcluir] = useState<CategoriaItem | null>(null)
  const [tipoParaExcluir, setTipoParaExcluir] = useState<{
    categoria: CategoriaItem
    tipo: TipoSolicitacaoItem
  } | null>(null)
  const [confirmarReset, setConfirmarReset] = useState(false)

  // Métricas
  const totalCategorias = categorias.length
  const totalTipos = useMemo(
    () => categorias.reduce((acc, c) => acc + c.tiposSolicitacao.length, 0),
    [categorias],
  )
  const mediaTiposPorCategoria =
    totalCategorias > 0 ? (totalTipos / totalCategorias).toFixed(1) : '0'

  // Filtro
  const categoriasFiltradas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return categorias

    return categorias.filter((c) => {
      const matchCat =
        c.nome.toLowerCase().includes(q) || c.descricao.toLowerCase().includes(q)
      const matchTipo = c.tiposSolicitacao.some(
        (t) =>
          t.nome.toLowerCase().includes(q) ||
          (t.descricao && t.descricao.toLowerCase().includes(q)),
      )
      return matchCat || matchTipo
    })
  }, [categorias, busca])

  // Handlers para Categoria
  function abrirNovaCategoria() {
    setCategoriaEdicao(null)
    setNomeCategoria('')
    setDescCategoria('')
    setErroCategoria('')
    setModalCategoriaAberta(true)
  }

  function abrirEditarCategoria(c: CategoriaItem) {
    setCategoriaEdicao(c)
    setNomeCategoria(c.nome)
    setDescCategoria(c.descricao)
    setErroCategoria('')
    setModalCategoriaAberta(true)
  }

  function salvarCategoria(e: React.FormEvent) {
    e.preventDefault()
    if (!nomeCategoria.trim()) {
      setErroCategoria('Informe o nome da categoria.')
      return
    }

    if (categoriaEdicao) {
      editarCategoria(categoriaEdicao.id, {
        nome: nomeCategoria,
        descricao: descCategoria,
      })
      toast(`Categoria "${nomeCategoria}" atualizada com sucesso.`)
    } else {
      criarCategoria({
        nome: nomeCategoria,
        descricao: descCategoria,
      })
      toast(`Nova categoria "${nomeCategoria}" criada com sucesso.`)
    }

    setModalCategoriaAberta(false)
  }

  function executarExclusaoCategoria() {
    if (!categoriaParaExcluir) return
    deletarCategoria(categoriaParaExcluir.id)
    toast(`Categoria "${categoriaParaExcluir.nome}" excluída com sucesso.`)
    setCategoriaParaExcluir(null)
  }

  // Handlers para Tipo de Solicitação
  function abrirNovoTipo(categoria: CategoriaItem) {
    setCategoriaAlvoTipo(categoria)
    setTipoEdicao(null)
    setNomeTipo('')
    setDescTipo('')
    setPrazoDias(7)
    setDocumentosExigidos([])
    setErroTipo('')
    setModalTipoAberta(true)
  }

  function abrirEditarTipo(categoria: CategoriaItem, tipo: TipoSolicitacaoItem) {
    setCategoriaAlvoTipo(categoria)
    setTipoEdicao(tipo)
    setNomeTipo(tipo.nome)
    setDescTipo(tipo.descricao || '')
    setPrazoDias(tipo.prazoDias || 7)
    setDocumentosExigidos(tipo.documentosExigidos ?? [])
    setErroTipo('')
    setModalTipoAberta(true)
  }

  function salvarTipo(e: React.FormEvent) {
    e.preventDefault()
    if (!nomeTipo.trim()) {
      setErroTipo('Informe o nome do tipo de solicitação.')
      return
    }
    if (!categoriaAlvoTipo) return
    const documentoSemNome = documentosExigidos.some((documento) => !documento.nome.trim())
    const documentoSemFormato = documentosExigidos.some(
      (documento) => documento.formatosAceitos.length === 0,
    )
    if (documentoSemNome || documentoSemFormato) {
      setErroTipo(
        documentoSemNome
          ? 'Informe o nome de todos os documentos exigidos.'
          : 'Selecione ao menos um formato aceito para cada documento.',
      )
      return
    }

    if (tipoEdicao) {
      editarTipoSolicitacao(categoriaAlvoTipo.id, tipoEdicao.id, {
        nome: nomeTipo,
        descricao: descTipo,
        prazoDias: Number(prazoDias) || 7,
        documentosExigidos,
      })
      toast(`Tipo "${nomeTipo}" atualizado com sucesso.`)
    } else {
      adicionarTipoSolicitacao(categoriaAlvoTipo.id, {
        nome: nomeTipo,
        descricao: descTipo,
        prazoDias: Number(prazoDias) || 7,
        documentosExigidos,
      })
      toast(`Novo tipo "${nomeTipo}" adicionado a ${categoriaAlvoTipo.nome}.`)
    }

    setModalTipoAberta(false)
  }

  function atualizarDocumento(id: string, dados: Partial<DocumentoExigido>) {
    setDocumentosExigidos((atuais) =>
      atuais.map((documento) =>
        documento.id === id ? { ...documento, ...dados } : documento,
      ),
    )
    if (erroTipo) setErroTipo('')
  }

  function moverDocumento(indice: number, direcao: -1 | 1) {
    const destino = indice + direcao
    if (destino < 0 || destino >= documentosExigidos.length) return
    setDocumentosExigidos((atuais) => {
      const reordenados = [...atuais]
      ;[reordenados[indice], reordenados[destino]] = [
        reordenados[destino],
        reordenados[indice],
      ]
      return reordenados
    })
  }

  function executarExclusaoTipo() {
    if (!tipoParaExcluir) return
    deletarTipoSolicitacao(tipoParaExcluir.categoria.id, tipoParaExcluir.tipo.id)
    toast(`Tipo "${tipoParaExcluir.tipo.nome}" removido de ${tipoParaExcluir.categoria.nome}.`)
    setTipoParaExcluir(null)
  }

  function executarReset() {
    restaurarCategoriasPadrao()
    toast('Categorias e tipos de solicitação restaurados para o padrão inicial.')
    setConfirmarReset(false)
  }

  return (
    <>
      <PageHeader
        titulo="Categorias e Tipos de Solicitação"
        descricao="Gerencie os perfis de solicitantes e configure quais tipos de solicitação estão disponíveis para cada categoria no sistema do PPGFIL."
      >
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setConfirmarReset(true)}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-foreground transition hover:border-primary/40 hover:text-primary"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Restaurar padrões
          </button>
          <button
            type="button"
            onClick={abrirNovaCategoria}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-extrabold text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            <Plus className="size-4" aria-hidden="true" />
            Nova Categoria
          </button>
        </div>
      </PageHeader>

      <div className="grid gap-6 px-6 py-6 lg:px-8">
        {/* Cards de Métricas */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Layers className="size-5" aria-hidden="true" />
            </span>
            <p className="mt-3 text-3xl font-extrabold tracking-tight text-foreground">
              {totalCategorias}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-muted-foreground">
              Categorias cadastradas
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <span className="grid size-10 place-items-center rounded-xl bg-[#3F7355]/15 text-[#2d5540]">
              <Tag className="size-5" aria-hidden="true" />
            </span>
            <p className="mt-3 text-3xl font-extrabold tracking-tight text-foreground">
              {totalTipos}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-muted-foreground">
              Tipos de solicitação ativos
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <span className="grid size-10 place-items-center rounded-xl bg-accent/20 text-[#7d6410]">
              <Sliders className="size-5" aria-hidden="true" />
            </span>
            <p className="mt-3 text-3xl font-extrabold tracking-tight text-foreground">
              {mediaTiposPorCategoria}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-muted-foreground">
              Média de serviços por categoria
            </p>
          </div>
        </section>

        {/* Barra de Busca */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Buscar categoria ou tipo de solicitação…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <p className="text-xs font-semibold text-muted-foreground">
            Exibindo {categoriasFiltradas.length} de {categorias.length} categorias
          </p>
        </div>

        {/* Lista de Categorias */}
        {!carregado ? (
          <p className="text-sm font-bold text-muted-foreground">Carregando categorias…</p>
        ) : categoriasFiltradas.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
            <FolderTree className="size-10 text-muted-foreground/40" />
            <h3 className="mt-3 text-base font-extrabold text-foreground">
              Nenhuma categoria encontrada
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Não encontramos resultados para o termo pesquisado ou ainda não há categorias cadastradas.
            </p>
            {busca && (
              <button
                type="button"
                onClick={() => setBusca('')}
                className="mt-4 rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-foreground transition hover:border-primary/40 hover:text-primary"
              >
                Limpar busca
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {categoriasFiltradas.map((c) => (
              <article
                key={c.id}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md"
              >
                {/* Cabeçalho da Categoria */}
                <div className="border-b border-border/80 bg-secondary/30 px-6 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="text-lg font-extrabold text-foreground">{c.nome}</h2>
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                          {c.tiposSolicitacao.length}{' '}
                          {c.tiposSolicitacao.length === 1 ? 'serviço' : 'serviços'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{c.descricao}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => abrirNovoTipo(c)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-card px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary/10"
                      >
                        <Plus className="size-3.5" aria-hidden="true" />
                        Adicionar tipo
                      </button>
                      <button
                        type="button"
                        onClick={() => abrirEditarCategoria(c)}
                        title={`Editar categoria ${c.nome}`}
                        className="grid size-8 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                      >
                        <Edit2 className="size-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategoriaParaExcluir(c)}
                        title={`Excluir categoria ${c.nome}`}
                        className="grid size-8 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Lista de Tipos de Solicitação da Categoria */}
                <div className="p-6">
                  {c.tiposSolicitacao.length === 0 ? (
                    <p className="text-xs italic text-muted-foreground">
                      Nenhum tipo de solicitação cadastrado para esta categoria. Clique em &quot;Adicionar tipo&quot; para vincular serviços.
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {c.tiposSolicitacao.map((t) => (
                        <div
                          key={t.id}
                          className="group relative flex flex-col justify-between rounded-xl border border-border bg-secondary/20 p-4 transition hover:border-primary/30 hover:bg-card hover:shadow-sm"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-sm font-bold text-foreground">{t.nome}</h3>
                              <div className="flex shrink-0 items-center gap-1 opacity-80 group-hover:opacity-100">
                                <button
                                  type="button"
                                  onClick={() => abrirEditarTipo(c, t)}
                                  title="Editar serviço"
                                  className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                                >
                                  <Edit2 className="size-3" aria-hidden="true" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTipoParaExcluir({ categoria: c, tipo: t })}
                                  title="Remover serviço"
                                  className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="size-3" aria-hidden="true" />
                                </button>
                              </div>
                            </div>
                            {t.descricao && (
                              <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                                {t.descricao}
                              </p>
                            )}
                          </div>

                          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-primary">
                            <Clock className="size-3 shrink-0" aria-hidden="true" />
                            <span>Prazo SLA: {t.prazoDias ?? 7} dias úteis</span>
                          </div>
                          {(t.documentosExigidos?.length ?? 0) > 0 && (
                            <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
                              {t.documentosExigidos!.length}{' '}
                              {t.documentosExigidos!.length === 1
                                ? 'documento configurado'
                                : 'documentos configurados'}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Modal Criar / Editar Categoria */}
      {modalCategoriaAberta && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-cat-titulo"
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-background/80 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 id="modal-cat-titulo" className="text-lg font-extrabold text-foreground">
                {categoriaEdicao ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
              <button
                type="button"
                onClick={() => setModalCategoriaAberta(false)}
                className="grid size-8 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={salvarCategoria} className="mt-5 grid gap-4">
              <Field
                label="Nome da categoria"
                required
                htmlFor="cat-nome"
                error={erroCategoria}
                hint="Ex.: Docente, Discente (Mestrado), Egresso, etc."
              >
                <TextInput
                  id="cat-nome"
                  value={nomeCategoria}
                  onChange={(e) => {
                    setNomeCategoria(e.target.value)
                    if (erroCategoria) setErroCategoria('')
                  }}
                  placeholder="Nome da categoria"
                  autoFocus
                />
              </Field>

              <Field
                label="Descrição"
                htmlFor="cat-desc"
                hint="Breve explicação de quem se enquadra nesta categoria."
              >
                <TextArea
                  id="cat-desc"
                  value={descCategoria}
                  onChange={(e) => setDescCategoria(e.target.value)}
                  placeholder="Ex.: Professores credenciados e orientadores do PPGFIL."
                  rows={3}
                />
              </Field>


              <div className="mt-4 flex justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setModalCategoriaAberta(false)}
                  className="rounded-full border border-border bg-card px-5 py-2.5 text-xs font-bold text-foreground transition hover:border-primary/40"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-primary px-6 py-2.5 text-xs font-extrabold text-primary-foreground shadow-sm transition hover:opacity-90"
                >
                  {categoriaEdicao ? 'Salvar alterações' : 'Criar categoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Criar / Editar Tipo de Solicitação */}
      {modalTipoAberta && categoriaAlvoTipo && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-tipo-titulo"
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-background/80 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 id="modal-tipo-titulo" className="text-lg font-extrabold text-foreground">
                  {tipoEdicao ? 'Editar Tipo de Solicitação' : 'Novo Tipo de Solicitação'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Categoria: <span className="font-bold text-primary">{categoriaAlvoTipo.nome}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalTipoAberta(false)}
                className="grid size-8 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={salvarTipo} className="mt-5 grid gap-4">
              <Field
                label="Nome do tipo de solicitação"
                required
                htmlFor="tipo-nome"
                error={erroTipo}
                hint="Ex.: Marcação de Defesa de Doutorado, Aproveitamento de Créditos, etc."
              >
                <TextInput
                  id="tipo-nome"
                  value={nomeTipo}
                  onChange={(e) => {
                    setNomeTipo(e.target.value)
                    if (erroTipo) setErroTipo('')
                  }}
                  placeholder="Nome do tipo de solicitação"
                  autoFocus
                />
              </Field>

              <Field
                label="Descrição do serviço"
                htmlFor="tipo-desc"
                hint="Explicação exibida para o solicitante ao selecionar esta opção."
              >
                <TextArea
                  id="tipo-desc"
                  value={descTipo}
                  onChange={(e) => setDescTipo(e.target.value)}
                  placeholder="Ex.: Solicitação formal de agendamento e composição de banca examinadora."
                  rows={2}
                />
              </Field>

              <Field
                label="Prazo padrão estimado (dias úteis)"
                htmlFor="tipo-prazo"
                hint="Utilizado para o cálculo de previsão e alerta de atraso na esteira."
              >
                <TextInput
                  id="tipo-prazo"
                  type="number"
                  min={1}
                  max={90}
                  value={prazoDias}
                  onChange={(e) => setPrazoDias(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </Field>

              <section className="grid gap-3 border-t border-border pt-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-foreground">Documentos exigidos</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Deixe a lista vazia para manter o upload livre e opcional.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDocumentosExigidos((atuais) => [...atuais, novoDocumentoExigido()])}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-card px-3 py-2 text-xs font-bold text-primary transition hover:bg-primary/10"
                  >
                    <Plus className="size-3.5" aria-hidden="true" />
                    Adicionar documento
                  </button>
                </div>

                {documentosExigidos.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border bg-secondary/30 px-4 py-5 text-center text-xs text-muted-foreground">
                    Nenhum documento específico configurado.
                  </p>
                ) : (
                  <div className="grid max-h-[45vh] gap-3 overflow-y-auto pr-1">
                    {documentosExigidos.map((documento, indice) => (
                      <article key={documento.id} className="rounded-xl border border-border bg-secondary/20 p-4">
                        <div className="flex items-start gap-3">
                          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-extrabold text-primary">
                            {indice + 1}
                          </span>
                          <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
                            <label className="grid gap-1 text-xs font-bold text-foreground sm:col-span-2">
                              Nome do documento
                              <TextInput
                                value={documento.nome}
                                onChange={(evento) => atualizarDocumento(documento.id, { nome: evento.target.value })}
                                placeholder="Ex.: Comprovante de matrícula anterior"
                              />
                            </label>
                            <fieldset className="grid gap-1 text-xs font-bold text-foreground">
                              <legend>Formatos aceitos</legend>
                              <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-xl border border-border bg-background px-2 py-1.5">
                                {FORMATOS_DISPONIVEIS.map((formato) => {
                                  const selecionado = documento.formatosAceitos.includes(formato)
                                  return (
                                    <button
                                      key={formato}
                                      type="button"
                                      aria-pressed={selecionado}
                                      onClick={() => atualizarDocumento(documento.id, {
                                        formatosAceitos: selecionado
                                          ? documento.formatosAceitos.filter((item) => item !== formato)
                                          : [...documento.formatosAceitos, formato],
                                      })}
                                      className={`rounded-md px-2 py-1 text-[10px] font-extrabold uppercase transition ${
                                        selecionado
                                          ? 'bg-primary text-primary-foreground'
                                          : 'bg-secondary text-muted-foreground hover:text-foreground'
                                      }`}
                                    >
                                      {formato}
                                    </button>
                                  )
                                })}
                              </div>
                            </fieldset>
                            <label className="grid gap-1 text-xs font-bold text-foreground">
                              Tamanho máximo (MB)
                              <TextInput
                                type="number"
                                min={1}
                                max={100}
                                value={documento.tamanhoMaximoMB}
                                onChange={(evento) => atualizarDocumento(documento.id, {
                                  tamanhoMaximoMB: Math.max(1, Number.parseInt(evento.target.value) || 1),
                                })}
                              />
                            </label>
                            <label className="grid gap-1 text-xs font-bold text-foreground sm:col-span-2">
                              Descrição opcional
                              <TextInput
                                value={documento.descricao ?? ''}
                                onChange={(evento) => atualizarDocumento(documento.id, { descricao: evento.target.value || undefined })}
                                placeholder="Orientação exibida ao solicitante"
                              />
                            </label>
                            <label className="inline-flex items-center gap-2 text-xs font-bold text-foreground">
                              <input
                                type="checkbox"
                                checked={documento.obrigatorio}
                                onChange={(evento) => atualizarDocumento(documento.id, { obrigatorio: evento.target.checked })}
                                className="size-4 accent-primary"
                              />
                              Documento obrigatório
                            </label>
                          </div>
                          <div className="grid shrink-0 gap-1">
                            <button type="button" onClick={() => moverDocumento(indice, -1)} disabled={indice === 0} title="Mover documento para cima" className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30">
                              <ArrowUp className="size-3.5" aria-hidden="true" />
                            </button>
                            <button type="button" onClick={() => moverDocumento(indice, 1)} disabled={indice === documentosExigidos.length - 1} title="Mover documento para baixo" className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30">
                              <ArrowDown className="size-3.5" aria-hidden="true" />
                            </button>
                            <button type="button" onClick={() => setDocumentosExigidos((atuais) => atuais.filter((item) => item.id !== documento.id))} title="Remover documento" className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                              <Trash2 className="size-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <div className="mt-4 flex justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setModalTipoAberta(false)}
                  className="rounded-full border border-border bg-card px-5 py-2.5 text-xs font-bold text-foreground transition hover:border-primary/40"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-primary px-6 py-2.5 text-xs font-extrabold text-primary-foreground shadow-sm transition hover:opacity-90"
                >
                  {tipoEdicao ? 'Salvar alterações' : 'Adicionar tipo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmação de Exclusão de Categoria */}
      <ConfirmacaoModal
        aberto={categoriaParaExcluir !== null}
        titulo="Excluir categoria?"
        descricao={
          categoriaParaExcluir
            ? `Tem certeza que deseja excluir a categoria "${categoriaParaExcluir.nome}" e seus ${categoriaParaExcluir.tiposSolicitacao.length} tipos de solicitação vinculados?`
            : ''
        }
        textoConfirmar="Excluir Categoria"
        tom="perigo"
        onCancelar={() => setCategoriaParaExcluir(null)}
        onConfirmar={executarExclusaoCategoria}
      />

      {/* Confirmação de Exclusão de Tipo */}
      <ConfirmacaoModal
        aberto={tipoParaExcluir !== null}
        titulo="Remover tipo de solicitação?"
        descricao={
          tipoParaExcluir
            ? `Deseja remover "${tipoParaExcluir.tipo.nome}" da categoria ${tipoParaExcluir.categoria.nome}?`
            : ''
        }
        textoConfirmar="Remover Tipo"
        tom="perigo"
        onCancelar={() => setTipoParaExcluir(null)}
        onConfirmar={executarExclusaoTipo}
      />

      {/* Confirmação de Reset para o padrão inicial */}
      <ConfirmacaoModal
        aberto={confirmarReset}
        titulo="Restaurar categorias e serviços padrão?"
        descricao="Todas as categorias e tipos de solicitação personalizados serão substituídos pela lista padrão do arquivo JSON inicial do sistema."
        textoConfirmar="Restaurar Padrões"
        onCancelar={() => setConfirmarReset(false)}
        onConfirmar={executarReset}
      />
    </>
  )
}
