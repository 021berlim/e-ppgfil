'use client'

import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  Download,
  Edit2,
  ExternalLink,
  FileText,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { ConfirmacaoModal } from '@/components/confirmacao-modal'
import { Field, Select, TextArea, TextInput } from '@/components/form-field'
import { toast } from '@/components/toast'
import { canManageAdministrativeCatalogs, isCoordinator } from '@/lib/auth-types'
import { cargoAtual } from '@/lib/store'

type EntityName = 'research-lines' | 'faculty-members' | 'procedures' | 'institutional-forms'

type ResearchLine = {
  id: string
  title: string
  summary: string | null
  disciplines: string[]
  source_url: string | null
}

type FacultyMember = {
  id: string
  full_name: string
  position: string
  expertise: string | null
  highest_degree: string | null
  lattes_url: string | null
  profile_url: string | null
  advising_count: number | null
  is_active: boolean
  research_lines: Array<{ id: string; title: string }>
}

type Procedure = {
  id: string
  title: string
  deadline_text: string | null
  steps: string[]
  source_url: string | null
}

type InstitutionalForm = {
  id: string
  name: string
  file_type: string
  source_url: string | null
  is_available: boolean
}

type Row = ResearchLine | FacultyMember | Procedure | InstitutionalForm

type FormState = Record<string, string | boolean | string[]>

const EMPTY: Record<EntityName, FormState> = {
  'research-lines': {
    title: '',
    summary: '',
    disciplines: '',
    source_url: '',
  },
  'faculty-members': {
    full_name: '',
    position: 'Professor',
    expertise: '',
    highest_degree: '',
    lattes_url: '',
    profile_url: '',
    advising_count: '',
    is_active: true,
    research_line_ids: [],
  },
  procedures: {
    title: '',
    deadline_text: '',
    steps: '',
    source_url: '',
  },
  'institutional-forms': {
    name: '',
    file_type: 'PDF',
    source_url: '',
    is_available: true,
  },
}

const TITLES: Record<EntityName, { singular: string; plural: string; created: string; updated: string }> = {
  'research-lines': {
    singular: 'linha de pesquisa',
    plural: 'linhas de pesquisa',
    created: 'Linha de pesquisa cadastrada.',
    updated: 'Linha de pesquisa atualizada.',
  },
  'faculty-members': {
    singular: 'docente',
    plural: 'docentes',
    created: 'Docente cadastrado.',
    updated: 'Docente atualizado.',
  },
  procedures: {
    singular: 'procedimento',
    plural: 'procedimentos',
    created: 'Procedimento cadastrado.',
    updated: 'Procedimento atualizado.',
  },
  'institutional-forms': {
    singular: 'documento',
    plural: 'documentos',
    created: 'Documento cadastrado.',
    updated: 'Documento atualizado.',
  },
}

const RESTRICTED_CATALOGS = new Set<EntityName>([
  'research-lines',
  'faculty-members',
  'procedures',
  'institutional-forms',
])

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.error ?? 'Nao foi possivel concluir a operacao.')
  }
  return data as T
}

function linesToArray(value: unknown) {
  if (Array.isArray(value)) return value
  if (typeof value !== 'string') return []
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function arrayToLines(value: unknown) {
  return Array.isArray(value) ? value.join('\n') : ''
}

function getTitle(entity: EntityName, row: Row) {
  if (entity === 'institutional-forms') return (row as InstitutionalForm).name
  if (entity === 'faculty-members') return (row as FacultyMember).full_name
  return (row as ResearchLine | Procedure).title
}

function matchesSearch(entity: EntityName, row: Row, query: string) {
  const text = [
    getTitle(entity, row),
    'summary' in row ? row.summary : '',
    'expertise' in row ? row.expertise : '',
    'highest_degree' in row ? row.highest_degree : '',
    'deadline_text' in row ? row.deadline_text : '',
    'file_type' in row ? row.file_type : '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase('pt-BR')

  return text.includes(query.toLocaleLowerCase('pt-BR'))
}

export function ResearchLinesManager() {
  return <InstitutionalCrud entity="research-lines" />
}

export function FacultyMembersManager() {
  return <InstitutionalCrud entity="faculty-members" />
}

export function ProceduresManager() {
  return <InstitutionalCrud entity="procedures" />
}

export function InstitutionalFormsManager() {
  return <InstitutionalCrud entity="institutional-forms" />
}

function InstitutionalCrud({ entity }: { entity: EntityName }) {
  const [rows, setRows] = useState<Row[]>([])
  const [researchLines, setResearchLines] = useState<ResearchLine[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Row | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY[entity])
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null)
  const meta = TITLES[entity]
  const currentRole = cargoAtual()
  const readOnly = RESTRICTED_CATALOGS.has(entity)
    ? !canManageAdministrativeCatalogs(currentRole)
    : isCoordinator(currentRole)

  async function load() {
    setLoading(true)
    try {
      const [items, lines] = await Promise.all([
        requestJson<Row[]>(`/api/admin/${entity}`),
        entity === 'faculty-members'
          ? requestJson<ResearchLine[]>('/api/admin/research-lines')
          : Promise.resolve([]),
      ])
      setRows(items)
      setResearchLines(lines)
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Erro ao carregar cadastro.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity])

  const filtered = useMemo(() => {
    const query = search.trim()
    if (!query) return rows
    return rows.filter((row) => matchesSearch(entity, row, query))
  }, [entity, rows, search])

  function openCreate() {
    setEditing(null)
    setForm({ ...EMPTY[entity] })
    setModalOpen(true)
  }

  function openEdit(row: Row) {
    setEditing(row)
    if (entity === 'research-lines') {
      const item = row as ResearchLine
      setForm({
        title: item.title,
        summary: item.summary ?? '',
        disciplines: arrayToLines(item.disciplines),
        source_url: item.source_url ?? '',
      })
    } else if (entity === 'faculty-members') {
      const item = row as FacultyMember
      setForm({
        full_name: item.full_name,
        position: item.position,
        expertise: item.expertise ?? '',
        highest_degree: item.highest_degree ?? '',
        lattes_url: item.lattes_url ?? '',
        profile_url: item.profile_url ?? '',
        advising_count: item.advising_count === null ? '' : String(item.advising_count),
        is_active: item.is_active,
        research_line_ids: item.research_lines.map((line) => line.id),
      })
    } else if (entity === 'procedures') {
      const item = row as Procedure
      setForm({
        title: item.title,
        deadline_text: item.deadline_text ?? '',
        steps: arrayToLines(item.steps),
        source_url: item.source_url ?? '',
      })
    } else {
      const item = row as InstitutionalForm
      setForm({
        name: item.name,
        file_type: item.file_type,
        source_url: item.source_url ?? '',
        is_available: item.is_available,
      })
    }
    setModalOpen(true)
  }

  function updateField(name: string, value: string | boolean | string[]) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      const payload = normalizePayload(entity, form)
      if (editing) {
        await requestJson(`/api/admin/${entity}`, {
          method: 'PUT',
          body: JSON.stringify({ id: editing.id, ...payload }),
        })
        toast(meta.updated)
      } else {
        await requestJson(`/api/admin/${entity}`, {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        toast(meta.created)
      }
      setModalOpen(false)
      await load()
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Erro ao salvar cadastro.')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      await requestJson(`/api/admin/${entity}?id=${encodeURIComponent(deleteTarget.id)}`, {
        method: 'DELETE',
      })
      toast(`${capitalize(meta.singular)} excluido.`)
      setDeleteTarget(null)
      await load()
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Erro ao excluir registro.')
    }
  }

  return (
    <section className="grid gap-5 px-6 py-6 lg:px-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <label className="relative w-full md:max-w-md">
          <span className="sr-only">Buscar</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`Buscar ${meta.plural}...`}
            className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm font-semibold outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </label>
        {!readOnly && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            <Plus className="size-4" aria-hidden="true" />
            Novo {meta.singular}
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {loading ? (
          <p className="px-5 py-8 text-sm font-bold text-muted-foreground">Carregando cadastro...</p>
        ) : filtered.length === 0 ? (
          <p className="px-5 py-8 text-sm font-bold text-muted-foreground">
            Nenhum registro encontrado.
          </p>
        ) : (
          <div className="max-h-[calc(100vh-16rem)] overflow-auto overscroll-contain">
            {entity === 'research-lines' && (
              <ResearchLinesTable rows={filtered as ResearchLine[]} onEdit={openEdit} onDelete={setDeleteTarget} readOnly={readOnly} />
            )}
            {entity === 'faculty-members' && (
              <FacultyTable rows={filtered as FacultyMember[]} onEdit={openEdit} onDelete={setDeleteTarget} readOnly={readOnly} />
            )}
            {entity === 'procedures' && (
              <ProceduresTable rows={filtered as Procedure[]} onEdit={openEdit} onDelete={setDeleteTarget} readOnly={readOnly} />
            )}
            {entity === 'institutional-forms' && (
              <FormsTable rows={filtered as InstitutionalForm[]} onEdit={openEdit} onDelete={setDeleteTarget} readOnly={readOnly} />
            )}
          </div>
        )}
      </div>

      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-background/80 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-foreground">
                  {editing ? `Editar ${meta.singular}` : `Novo ${meta.singular}`}
                </h2>
                <p className="text-xs text-muted-foreground">As alterações serão gravadas no Supabase.</p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="grid size-8 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                aria-label="Fechar"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={save} className="mt-5 grid max-h-[72vh] gap-4 overflow-y-auto pr-1">
              {entity === 'research-lines' && (
                <ResearchLineFields form={form} updateField={updateField} />
              )}
              {entity === 'faculty-members' && (
                <FacultyFields
                  form={form}
                  researchLines={researchLines}
                  updateField={updateField}
                />
              )}
              {entity === 'procedures' && <ProcedureFields form={form} updateField={updateField} />}
              {entity === 'institutional-forms' && <FormFields form={form} updateField={updateField} />}

              <div className="sticky bottom-0 mt-2 flex justify-end gap-3 border-t border-border bg-card pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-full border border-border bg-card px-5 py-2.5 text-xs font-bold text-foreground transition hover:border-primary/40"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-primary px-6 py-2.5 text-xs font-extrabold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmacaoModal
        aberto={deleteTarget !== null}
        titulo={`Excluir ${meta.singular}?`}
        descricao={
          deleteTarget
            ? `Deseja excluir "${getTitle(entity, deleteTarget)}"? Esta acao remove o cadastro do banco.`
            : ''
        }
        textoConfirmar="Excluir"
        tom="perigo"
        onCancelar={() => setDeleteTarget(null)}
        onConfirmar={confirmDelete}
      />
    </section>
  )
}

function ResearchLineFields({
  form,
  updateField,
}: {
  form: FormState
  updateField: (name: string, value: string | boolean | string[]) => void
}) {
  return (
    <>
      <Field label="Título" required htmlFor="title">
        <TextInput id="title" value={String(form.title)} onChange={(event) => updateField('title', event.target.value)} />
      </Field>
      <Field label="Resumo" htmlFor="summary">
        <TextArea id="summary" value={String(form.summary)} onChange={(event) => updateField('summary', event.target.value)} />
      </Field>
      <Field label="Disciplinas vinculadas" htmlFor="disciplines" hint="Informe uma disciplina por linha.">
        <TextArea id="disciplines" value={String(form.disciplines)} onChange={(event) => updateField('disciplines', event.target.value)} />
      </Field>
      <Field label="Fonte oficial" htmlFor="source_url">
        <TextInput id="source_url" value={String(form.source_url)} onChange={(event) => updateField('source_url', event.target.value)} />
      </Field>
    </>
  )
}

function FacultyFields({
  form,
  researchLines,
  updateField,
}: {
  form: FormState
  researchLines: ResearchLine[]
  updateField: (name: string, value: string | boolean | string[]) => void
}) {
  const selected = Array.isArray(form.research_line_ids) ? form.research_line_ids : []

  function toggleLine(id: string) {
    updateField(
      'research_line_ids',
      selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id],
    )
  }

  return (
    <>
      <Field label="Nome completo" required htmlFor="full_name">
        <TextInput id="full_name" value={String(form.full_name)} onChange={(event) => updateField('full_name', event.target.value)} />
      </Field>
      <Field label="Cargo" required htmlFor="position">
        <Select id="position" value={String(form.position)} onChange={(event) => updateField('position', event.target.value)}>
          <option value="Professor">Professor</option>
          <option value="Professora">Professora</option>
          <option value="Coordenador">Coordenador</option>
          <option value="Vice-coordenadora">Vice-coordenadora</option>
        </Select>
      </Field>
      <Field label="Área de atuação" htmlFor="expertise">
        <TextArea id="expertise" value={String(form.expertise)} onChange={(event) => updateField('expertise', event.target.value)} />
      </Field>
      <Field label="Maior pós-graduação" htmlFor="highest_degree">
        <TextInput id="highest_degree" value={String(form.highest_degree)} onChange={(event) => updateField('highest_degree', event.target.value)} />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Currículo Lattes" htmlFor="lattes_url">
          <TextInput id="lattes_url" value={String(form.lattes_url)} onChange={(event) => updateField('lattes_url', event.target.value)} />
        </Field>
        <Field label="Página oficial" htmlFor="profile_url">
          <TextInput id="profile_url" value={String(form.profile_url)} onChange={(event) => updateField('profile_url', event.target.value)} />
        </Field>
      </div>
      <Field label="Orientações" htmlFor="advising_count">
        <TextInput id="advising_count" type="number" min={0} value={String(form.advising_count)} onChange={(event) => updateField('advising_count', event.target.value)} />
      </Field>
      <fieldset className="grid gap-2">
        <legend className="text-sm font-bold text-foreground">Linhas de pesquisa</legend>
        <div className="grid gap-2 rounded-xl border border-border bg-secondary/25 p-3 sm:grid-cols-2">
          {researchLines.length === 0 ? (
            <p className="text-xs font-semibold text-muted-foreground">Nenhuma linha cadastrada.</p>
          ) : (
            researchLines.map((line) => (
              <label key={line.id} className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <input
                  type="checkbox"
                  checked={selected.includes(line.id)}
                  onChange={() => toggleLine(line.id)}
                  className="size-4 accent-primary"
                />
                {line.title}
              </label>
            ))
          )}
        </div>
      </fieldset>
      <BooleanField label="Docente ativo" checked={Boolean(form.is_active)} onChange={(value) => updateField('is_active', value)} />
    </>
  )
}

function ProcedureFields({
  form,
  updateField,
}: {
  form: FormState
  updateField: (name: string, value: string | boolean | string[]) => void
}) {
  return (
    <>
      <Field label="Título" required htmlFor="title">
        <TextInput id="title" value={String(form.title)} onChange={(event) => updateField('title', event.target.value)} />
      </Field>
      <Field label="Prazo" htmlFor="deadline_text">
        <TextInput id="deadline_text" value={String(form.deadline_text)} onChange={(event) => updateField('deadline_text', event.target.value)} />
      </Field>
      <Field label="Passos do procedimento" htmlFor="steps" hint="Informe um passo por linha.">
        <TextArea id="steps" value={String(form.steps)} onChange={(event) => updateField('steps', event.target.value)} className="min-h-44" />
      </Field>
      <Field label="Fonte oficial" htmlFor="source_url">
        <TextInput id="source_url" value={String(form.source_url)} onChange={(event) => updateField('source_url', event.target.value)} />
      </Field>
    </>
  )
}

function FormFields({
  form,
  updateField,
}: {
  form: FormState
  updateField: (name: string, value: string | boolean | string[]) => void
}) {
  return (
    <>
      <Field label="Nome do documento" required htmlFor="name">
        <TextInput id="name" value={String(form.name)} onChange={(event) => updateField('name', event.target.value)} />
      </Field>
      <Field label="Tipo de arquivo" required htmlFor="file_type">
        <Select id="file_type" value={String(form.file_type)} onChange={(event) => updateField('file_type', event.target.value)}>
          <option value="PDF">PDF</option>
          <option value="DOC">DOC</option>
          <option value="DOCX">DOCX</option>
          <option value="LINK">LINK</option>
        </Select>
      </Field>
      <Field label="URL do documento" htmlFor="source_url">
        <TextInput id="source_url" value={String(form.source_url)} onChange={(event) => updateField('source_url', event.target.value)} />
      </Field>
      <BooleanField label="Documento disponível" checked={Boolean(form.is_available)} onChange={(value) => updateField('is_available', value)} />
    </>
  )
}

function BooleanField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm font-bold text-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 accent-primary"
      />
      {label}
    </label>
  )
}

function RowActions({
  row,
  onEdit,
  onDelete,
}: {
  row: Row
  onEdit: (row: Row) => void
  onDelete: (row: Row) => void
}) {
  return (
    <td className="whitespace-nowrap px-5 py-4 text-right">
      <button
        type="button"
        onClick={() => onEdit(row)}
        className="mr-2 inline-grid size-8 place-items-center rounded-lg border border-border text-muted-foreground transition hover:border-primary/40 hover:text-primary"
        aria-label="Editar"
      >
        <Edit2 className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onDelete(row)}
        className="inline-grid size-8 place-items-center rounded-lg border border-border text-muted-foreground transition hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
        aria-label="Excluir"
      >
        <Trash2 className="size-3.5" />
      </button>
    </td>
  )
}

function ResearchLinesTable({
  rows,
  onEdit,
  onDelete,
  readOnly,
}: {
  rows: ResearchLine[]
  onEdit: (row: Row) => void
  onDelete: (row: Row) => void
  readOnly: boolean
}) {
  return (
    <table className="w-full min-w-[860px] text-left text-sm">
      <TableHead labels={readOnly ? ['Linha', 'Resumo', 'Disciplinas'] : ['Linha', 'Resumo', 'Disciplinas', '']} />
      <tbody className="divide-y divide-border">
        {rows.map((row) => (
          <tr key={row.id} className="align-top transition hover:bg-secondary/35">
            <td className="px-5 py-4 font-extrabold text-foreground">{row.title}</td>
            <td className="max-w-md px-5 py-4 text-muted-foreground">{row.summary ?? 'Sem resumo'}</td>
            <td className="px-5 py-4 text-xs font-semibold text-muted-foreground">{row.disciplines.join(', ') || 'Sem disciplinas'}</td>
            {!readOnly && <RowActions row={row} onEdit={onEdit} onDelete={onDelete} />}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function FacultyTable({
  rows,
  onEdit,
  onDelete,
  readOnly,
}: {
  rows: FacultyMember[]
  onEdit: (row: Row) => void
  onDelete: (row: Row) => void
  readOnly: boolean
}) {
  return (
    <table className="w-full min-w-[1080px] text-left text-sm">
      <TableHead labels={readOnly ? ['Docente', 'Cargo', 'Área', 'Linhas', 'Links', 'Status'] : ['Docente', 'Cargo', 'Área', 'Linhas', 'Links', 'Status', '']} />
      <tbody className="divide-y divide-border">
        {rows.map((row) => (
          <tr key={row.id} className="align-top transition hover:bg-secondary/35">
            <td className="px-5 py-4">
              <p className="font-extrabold text-foreground">{row.full_name}</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">{row.highest_degree ?? 'Formação não informada'}</p>
            </td>
            <td className="px-5 py-4 font-semibold text-foreground">{row.position}</td>
            <td className="max-w-md px-5 py-4 text-muted-foreground">{row.expertise ?? 'Área não informada'}</td>
            <td className="px-5 py-4 text-xs font-semibold text-muted-foreground">
              {row.research_lines.map((line) => line.title).join(', ') || 'Sem vínculo'}
            </td>
            <td className="px-5 py-4">
              <LinkList links={[['Perfil', row.profile_url], ['Lattes', row.lattes_url]]} />
            </td>
            <StatusCell active={row.is_active} />
            {!readOnly && <RowActions row={row} onEdit={onEdit} onDelete={onDelete} />}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function ProceduresTable({
  rows,
  onEdit,
  onDelete,
  readOnly,
}: {
  rows: Procedure[]
  onEdit: (row: Row) => void
  onDelete: (row: Row) => void
  readOnly: boolean
}) {
  return (
    <table className="w-full min-w-[920px] text-left text-sm">
      <TableHead labels={readOnly ? ['Procedimento', 'Prazo', 'Passos', 'Fonte'] : ['Procedimento', 'Prazo', 'Passos', 'Fonte', '']} />
      <tbody className="divide-y divide-border">
        {rows.map((row) => (
          <tr key={row.id} className="align-top transition hover:bg-secondary/35">
            <td className="px-5 py-4 font-extrabold text-foreground">{row.title}</td>
            <td className="px-5 py-4 text-muted-foreground">{row.deadline_text ?? 'Sem prazo'}</td>
            <td className="px-5 py-4 text-xs font-semibold text-muted-foreground">{row.steps.length} passo(s)</td>
            <td className="px-5 py-4">
              <LinkList links={[['Fonte', row.source_url]]} />
            </td>
            {!readOnly && <RowActions row={row} onEdit={onEdit} onDelete={onDelete} />}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function FormsTable({
  rows,
  onEdit,
  onDelete,
  readOnly,
}: {
  rows: InstitutionalForm[]
  onEdit: (row: Row) => void
  onDelete: (row: Row) => void
  readOnly: boolean
}) {
  return (
    <table className="w-full min-w-[820px] text-left text-sm">
      <TableHead labels={readOnly ? ['Documento', 'Tipo', 'URL', 'Status'] : ['Documento', 'Tipo', 'URL', 'Status', '']} />
      <tbody className="divide-y divide-border">
        {rows.map((row) => (
          <tr key={row.id} className="align-top transition hover:bg-secondary/35">
            <td className="px-5 py-4">
              <span className="inline-flex items-center gap-2 font-extrabold text-foreground">
                <FileText className="size-4 text-primary" />
                {row.name}
              </span>
            </td>
            <td className="px-5 py-4 font-semibold text-foreground">{row.file_type}</td>
            <td className="px-5 py-4">
              <LinkList links={[[row.source_url ? 'Abrir' : 'Sem URL', row.source_url]]} icon="download" />
            </td>
            <StatusCell active={row.is_available} activeText="Disponível" inactiveText="Indisponível" />
            {!readOnly && <RowActions row={row} onEdit={onEdit} onDelete={onDelete} />}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function TableHead({ labels }: { labels: string[] }) {
  return (
    <thead className="sticky top-0 z-10 bg-secondary text-xs uppercase tracking-wider text-muted-foreground shadow-sm">
      <tr>
        {labels.map((label) => (
          <th key={label || 'actions'} className="px-5 py-3 font-extrabold">
            {label}
          </th>
        ))}
      </tr>
    </thead>
  )
}

function StatusCell({
  active,
  activeText = 'Ativo',
  inactiveText = 'Inativo',
}: {
  active: boolean
  activeText?: string
  inactiveText?: string
}) {
  return (
    <td className="px-5 py-4">
      <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${active ? 'bg-[#3F7355]/15 text-[#2d5540]' : 'bg-secondary text-muted-foreground'}`}>
        {active ? activeText : inactiveText}
      </span>
    </td>
  )
}

function LinkList({
  links,
  icon = 'external',
}: {
  links: Array<[string, string | null]>
  icon?: 'external' | 'download'
}) {
  const Icon = icon === 'download' ? Download : ExternalLink
  const available = links.filter(([, href]) => href)
  if (available.length === 0) {
    return <span className="text-xs font-semibold text-muted-foreground">Sem link</span>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {available.map(([label, href]) => (
        <a
          key={`${label}-${href}`}
          href={href ?? undefined}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-bold text-primary transition hover:border-primary/40"
        >
          <Icon className="size-3.5" />
          {label}
        </a>
      ))}
    </div>
  )
}

function normalizePayload(entity: EntityName, form: FormState) {
  if (entity === 'research-lines') {
    return {
      title: form.title,
      summary: form.summary,
      disciplines: linesToArray(form.disciplines),
      source_url: form.source_url,
    }
  }

  if (entity === 'faculty-members') {
    return {
      full_name: form.full_name,
      position: form.position,
      expertise: form.expertise,
      highest_degree: form.highest_degree,
      lattes_url: form.lattes_url,
      profile_url: form.profile_url,
      advising_count: form.advising_count,
      is_active: form.is_active,
      research_line_ids: form.research_line_ids,
    }
  }

  if (entity === 'procedures') {
    return {
      title: form.title,
      deadline_text: form.deadline_text,
      steps: linesToArray(form.steps),
      source_url: form.source_url,
    }
  }

  return {
    name: form.name,
    file_type: form.file_type,
    source_url: form.source_url,
    is_available: form.is_available,
  }
}

function capitalize(value: string) {
  return value.charAt(0).toLocaleUpperCase('pt-BR') + value.slice(1)
}
