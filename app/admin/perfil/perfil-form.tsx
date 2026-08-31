'use client'

import type React from 'react'
import { useEffect, useState } from 'react'
import { BadgeCheck, Camera, KeyRound, Mail, Save, ShieldCheck, Trash2, UserCircle } from 'lucide-react'
import { Field, TextInput } from '@/components/form-field'
import { toast } from '@/components/toast'
import { login, usuarioAtualInfo } from '@/lib/store'
import { DASHBOARD_ROLE_LABELS, type ClientSession } from '@/lib/auth-types'

type FormState = {
  name: string
  email: string
  avatar_url: string | null
  role: ClientSession['role'] | null
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const EMPTY_FORM: FormState = {
  name: '',
  email: '',
  avatar_url: null,
  role: null,
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
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

export function PerfilForm() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const local = usuarioAtualInfo()
    if (local) {
      setForm((current) => ({
        ...current,
        name: local.name ?? '',
        email: local.email,
        avatar_url: local.avatar_url ?? null,
        role: local.role,
      }))
    }

    requestJson<ClientSession>('/api/auth/me')
      .then((session) => {
        login(session)
        setForm((current) => ({
          ...current,
          name: session.name ?? '',
          email: session.email,
          avatar_url: session.avatar_url ?? null,
          role: session.role,
        }))
      })
      .catch((error) => toast(error instanceof Error ? error.message : 'Erro ao carregar perfil.'))
      .finally(() => setLoading(false))
  }, [])

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast('Selecione um arquivo de imagem.')
      return
    }
    if (file.size > 1_000_000) {
      toast('A foto deve ter no maximo 1 MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateField('avatar_url', reader.result)
      }
    }
    reader.onerror = () => toast('Nao foi possivel ler a imagem.')
    reader.readAsDataURL(file)
  }

  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (form.newPassword || form.confirmPassword || form.currentPassword) {
      if (form.newPassword !== form.confirmPassword) {
        toast('A confirmacao da nova senha nao confere.')
        return
      }
      if (!form.currentPassword) {
        toast('Informe a senha atual para alterar a senha.')
        return
      }
    }

    setSaving(true)
    try {
      const updated = await requestJson<ClientSession>('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          email: form.email,
          avatar_url: form.avatar_url,
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      })
      login(updated)
      setForm((current) => ({
        ...current,
        name: updated.name ?? '',
        email: updated.email,
        avatar_url: updated.avatar_url ?? null,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }))
      toast('Perfil atualizado.')
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Erro ao salvar perfil.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <section className="px-6 py-6 lg:px-8">
        <p className="text-sm font-bold text-muted-foreground">Carregando perfil...</p>
      </section>
    )
  }

  return (
    <section className="px-6 py-6 lg:px-8">
      <form onSubmit={save} className="mx-auto grid max-w-6xl gap-6">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="relative min-h-52 bg-[radial-gradient(circle_at_15%_15%,rgba(201,162,39,0.34),transparent_32%),linear-gradient(135deg,#551724_0%,#7d2a3a_48%,#c9a227_100%)] px-5 py-5 sm:px-7">
            <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-card to-transparent" />
            <div className="relative flex justify-end">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-xs font-extrabold text-white shadow-sm backdrop-blur-md">
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                Conta protegida
              </span>
            </div>
          </div>

          <div className="relative px-5 pb-6 sm:px-7">
            <div className="-mt-20 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="relative w-fit">
                  {form.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.avatar_url}
                      alt=""
                      className="size-36 rounded-full border-4 border-card object-cover shadow-xl ring-1 ring-border sm:size-40"
                    />
                  ) : (
                    <span className="grid size-36 place-items-center rounded-full border-4 border-card bg-secondary text-primary shadow-xl ring-1 ring-border sm:size-40">
                      <UserCircle className="size-20" aria-hidden="true" />
                    </span>
                  )}
                  <label className="absolute bottom-2 right-2 grid size-11 cursor-pointer place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:opacity-90">
                    <Camera className="size-5" aria-hidden="true" />
                    <span className="sr-only">Alterar foto</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={handleAvatarChange}
                      className="sr-only"
                    />
                  </label>
                </div>

                <div className="min-w-0 pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="max-w-full truncate text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                      {form.name || 'Seu perfil'}
                    </h2>
                    <BadgeCheck className="size-5 shrink-0 text-accent" aria-hidden="true" />
                  </div>
                  <p className="mt-1 break-all text-sm font-bold text-muted-foreground">{form.email}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-extrabold text-primary">
                      {form.role ? DASHBOARD_ROLE_LABELS[form.role] : 'Dashboard'}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-bold text-muted-foreground">
                      PPGFIL
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-foreground shadow-sm transition hover:opacity-90">
                  <Camera className="size-4" aria-hidden="true" />
                  Alterar foto
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleAvatarChange}
                    className="sr-only"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => updateField('avatar_url', null)}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground transition hover:border-primary/40"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Remover foto
                </button>
              </div>
            </div>
            <p className="mt-4 text-xs font-semibold text-muted-foreground">
              O nome do usuario e administrado pela secretaria. Nesta area voce pode atualizar foto, e-mail e senha.
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="grid gap-6">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Mail className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-base font-extrabold text-foreground">Dados de acesso</h2>
                  <p className="text-xs font-semibold text-muted-foreground">E-mail usado para entrar no painel.</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
                <Field label="Nome" htmlFor="profile-name" hint="Este campo nao pode ser alterado pelo proprio usuario.">
                  <TextInput
                    id="profile-name"
                    value={form.name}
                    disabled
                    className="bg-secondary/70 text-muted-foreground disabled:cursor-not-allowed disabled:opacity-100"
                  />
                </Field>
                <Field label="E-mail" required htmlFor="profile-email">
                  <TextInput
                    id="profile-email"
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField('email', event.target.value)}
                    autoComplete="email"
                  />
                </Field>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <KeyRound className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-base font-extrabold text-foreground">Seguranca</h2>
                  <p className="text-xs font-semibold text-muted-foreground">A senha atual confirma que a alteracao e sua.</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Senha atual" htmlFor="current-password">
                  <TextInput
                    id="current-password"
                    type="password"
                    value={form.currentPassword}
                    onChange={(event) => updateField('currentPassword', event.target.value)}
                    autoComplete="current-password"
                  />
                </Field>
                <Field label="Nova senha" htmlFor="new-password" hint="Use pelo menos 8 caracteres.">
                  <TextInput
                    id="new-password"
                    type="password"
                    value={form.newPassword}
                    onChange={(event) => updateField('newPassword', event.target.value)}
                    autoComplete="new-password"
                  />
                </Field>
                <Field label="Confirmar nova senha" htmlFor="confirm-password">
                  <TextInput
                    id="confirm-password"
                    type="password"
                    value={form.confirmPassword}
                    onChange={(event) => updateField('confirmPassword', event.target.value)}
                    autoComplete="new-password"
                  />
                </Field>
              </div>
            </div>
          </div>

          <aside className="grid gap-4 content-start">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-sm font-extrabold text-foreground">Resumo da conta</h2>
              <dl className="mt-4 grid gap-3 text-sm">
                <div className="rounded-xl bg-secondary/70 p-3">
                  <dt className="text-xs font-bold uppercase text-muted-foreground">Usuario</dt>
                  <dd className="mt-1 truncate font-extrabold text-foreground">{form.name || 'Nao informado'}</dd>
                </div>
                <div className="rounded-xl bg-secondary/70 p-3">
                  <dt className="text-xs font-bold uppercase text-muted-foreground">Cargo</dt>
                  <dd className="mt-1 font-extrabold text-foreground">
                    {form.role ? DASHBOARD_ROLE_LABELS[form.role] : 'Dashboard'}
                  </dd>
                </div>
                <div className="rounded-xl bg-secondary/70 p-3">
                  <dt className="text-xs font-bold uppercase text-muted-foreground">Foto</dt>
                  <dd className="mt-1 font-extrabold text-foreground">
                    {form.avatar_url ? 'Personalizada' : 'Padrao do sistema'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-primary/8 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <ShieldCheck className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-sm font-extrabold text-foreground">Privacidade</h2>
                  <p className="text-xs font-semibold leading-relaxed text-muted-foreground">
                    Sua senha e salva somente como hash bcrypt.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className="sticky bottom-0 z-10 -mx-6 border-t border-border bg-background/90 px-6 py-4 backdrop-blur-md lg:-mx-8 lg:px-8">
          <div className="mx-auto flex max-w-6xl justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-extrabold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="size-4" aria-hidden="true" />
              {saving ? 'Salvando...' : 'Salvar perfil'}
            </button>
          </div>
        </div>
      </form>
    </section>
  )
}
