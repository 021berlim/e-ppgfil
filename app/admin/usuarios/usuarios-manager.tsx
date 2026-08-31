'use client'

import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Edit2, Plus, Search, Shield, Trash2, UserRound, X } from 'lucide-react'
import { ConfirmacaoModal } from '@/components/confirmacao-modal'
import { Field, Select, TextInput } from '@/components/form-field'
import { toast } from '@/components/toast'
import { cargoAtual } from '@/lib/store'
import { DASHBOARD_ROLE_LABELS, canCreateUsers } from '@/lib/auth-types'

type RoleSlug = 'ROOT' | 'SECRETARY_ADMIN' | 'SECRETARY_OPERATOR' | 'COORDINATOR'

type Role = {
  id: string
  slug: RoleSlug
  name: string
  description: string | null
}

type DashboardUser = {
  id: string
  name: string
  email: string
  avatar_url: string | null
  role: RoleSlug | null
  role_name: string | null
  is_active: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string
}

type FormState = {
  name: string
  email: string
  password: string
  role: RoleSlug
  is_active: boolean
}

const EMPTY_FORM: FormState = {
  name: '',
  email: '',
  password: '',
  role: 'SECRETARY_OPERATOR',
  is_active: true,
}

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

export function UsuariosManager() {
  const [users, setUsers] = useState<DashboardUser[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<DashboardUser | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState<DashboardUser | null>(null)
  const [currentRole, setCurrentRole] = useState<RoleSlug | null>(null)
  const allowCreate = canCreateUsers(currentRole)

  async function load() {
    setLoading(true)
    try {
      const [userRows, roleRows] = await Promise.all([
        requestJson<DashboardUser[]>('/api/admin/users'),
        requestJson<Role[]>('/api/admin/roles'),
      ])
      setUsers(userRows)
      setRoles(roleRows)
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Erro ao carregar usuarios.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setCurrentRole(cargoAtual())
    void load()
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR')
    if (!query) return users
    return users.filter((user) =>
      [user.name, user.email, user.role]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase('pt-BR').includes(query)),
    )
  }, [search, users])

  function openCreate() {
    if (!allowCreate) return
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(user: DashboardUser) {
    setEditing(user)
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role ?? 'SECRETARY_OPERATOR',
      is_active: user.is_active,
    })
    setModalOpen(true)
  }

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await requestJson('/api/admin/users', {
          method: 'PUT',
          body: JSON.stringify({ id: editing.id, ...form }),
        })
        toast('Usuario atualizado.')
      } else {
        await requestJson('/api/admin/users', {
          method: 'POST',
          body: JSON.stringify(form),
        })
        toast('Usuario criado.')
      }
      setModalOpen(false)
      await load()
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Erro ao salvar usuario.')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      await requestJson(`/api/admin/users?id=${encodeURIComponent(deleteTarget.id)}`, {
        method: 'DELETE',
      })
      toast('Usuario excluido.')
      setDeleteTarget(null)
      await load()
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Erro ao excluir usuario.')
    }
  }

  return (
    <section className="grid gap-5 px-6 py-6 lg:px-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <label className="relative w-full md:max-w-md">
          <span className="sr-only">Buscar usuarios</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar usuario, e-mail ou cargo..."
            className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm font-semibold outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </label>
        {allowCreate && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            <Plus className="size-4" aria-hidden="true" />
            Novo usuario
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {loading ? (
          <p className="px-5 py-8 text-sm font-bold text-muted-foreground">Carregando usuarios...</p>
        ) : filtered.length === 0 ? (
          <p className="px-5 py-8 text-sm font-bold text-muted-foreground">
            Nenhum usuario encontrado.
          </p>
        ) : (
          <div className="max-h-[calc(100vh-16rem)] overflow-auto overscroll-contain">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-secondary text-xs uppercase tracking-wider text-muted-foreground shadow-sm">
                <tr>
                  <th className="px-5 py-3 font-extrabold">Usuario</th>
                  <th className="px-5 py-3 font-extrabold">Cargo</th>
                  <th className="px-5 py-3 font-extrabold">Status</th>
                  <th className="px-5 py-3 font-extrabold">Ultimo login</th>
                  <th className="px-5 py-3 font-extrabold">Criado em</th>
                  <th className="px-5 py-3 font-extrabold" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((user) => (
                  <tr key={user.id} className="align-top transition hover:bg-secondary/35">
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        {user.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={user.avatar_url}
                            alt=""
                            className="size-9 shrink-0 rounded-full object-cover ring-1 ring-border"
                          />
                        ) : (
                          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                            <UserRound className="size-4" aria-hidden="true" />
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="font-extrabold text-foreground">{user.name}</p>
                          <p className="mt-0.5 text-xs font-semibold text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-extrabold text-foreground">
                        <Shield className="size-3.5 text-primary" aria-hidden="true" />
                        {user.role ? DASHBOARD_ROLE_LABELS[user.role] : 'Sem cargo'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${user.is_active ? 'bg-[#3F7355]/15 text-[#2d5540]' : 'bg-secondary text-muted-foreground'}`}>
                        {user.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-muted-foreground">
                      {formatDate(user.last_login_at)}
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-muted-foreground">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(user)}
                        className="mr-2 inline-grid size-8 place-items-center rounded-lg border border-border text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                        aria-label={`Editar ${user.name}`}
                      >
                        <Edit2 className="size-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(user)}
                        className="inline-grid size-8 place-items-center rounded-lg border border-border text-muted-foreground transition hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Excluir ${user.name}`}
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-background/80 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-foreground">
                  {editing ? 'Editar usuario' : 'Novo usuario'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Senhas sao armazenadas somente como hash bcrypt no banco.
                </p>
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

            <form onSubmit={save} className="mt-5 grid gap-4">
              <Field label="Nome" required htmlFor="user-name">
                <TextInput
                  id="user-name"
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  autoFocus
                />
              </Field>
              <Field label="E-mail" required htmlFor="user-email">
                <TextInput
                  id="user-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                />
              </Field>
              <Field
                label={editing ? 'Nova senha' : 'Senha'}
                required={!editing}
                htmlFor="user-password"
                hint={editing ? 'Deixe vazio para manter a senha atual.' : 'Use pelo menos 8 caracteres.'}
              >
                <TextInput
                  id="user-password"
                  type="password"
                  value={form.password}
                  onChange={(event) => updateField('password', event.target.value)}
                  autoComplete="new-password"
                />
              </Field>
              <Field label="Cargo" required htmlFor="user-role">
                <Select
                  id="user-role"
                  value={form.role}
                  onChange={(event) => updateField('role', event.target.value as RoleSlug)}
                >
                  {roles.map((role) => (
                    <option key={role.slug} value={role.slug}>
                      {DASHBOARD_ROLE_LABELS[role.slug]}
                    </option>
                  ))}
                </Select>
              </Field>
              <label className="inline-flex items-center gap-2 text-sm font-bold text-foreground">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) => updateField('is_active', event.target.checked)}
                  className="size-4 accent-primary"
                />
                Usuario ativo
              </label>

              <div className="mt-2 flex justify-end gap-3 border-t border-border pt-4">
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
                  {saving ? 'Salvando...' : 'Salvar usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmacaoModal
        aberto={deleteTarget !== null}
        titulo="Excluir usuario?"
        descricao={
          deleteTarget
            ? `Deseja excluir "${deleteTarget.name}"? As sessoes e cargos vinculados tambem serao removidos.`
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

function formatDate(value: string | null) {
  if (!value) return 'Nunca'
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
