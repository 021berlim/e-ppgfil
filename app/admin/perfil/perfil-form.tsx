'use client'

import type React from 'react'
import { useEffect, useState } from 'react'
import { Camera, KeyRound, Mail, Save, Trash2, UserCircle } from 'lucide-react'
import { Field, TextInput } from '@/components/form-field'
import { toast } from '@/components/toast'
import { login, usuarioAtualInfo } from '@/lib/store'
import type { ClientSession } from '@/lib/auth-types'

type FormState = {
  name: string
  email: string
  avatar_url: string | null
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const EMPTY_FORM: FormState = {
  name: '',
  email: '',
  avatar_url: null,
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
          name: form.name,
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
      <form onSubmit={save} className="grid max-w-5xl gap-5 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col items-center text-center">
            {form.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.avatar_url}
                alt=""
                className="size-40 rounded-full object-cover ring-4 ring-primary/12"
              />
            ) : (
              <span className="grid size-40 place-items-center rounded-full bg-secondary text-primary ring-4 ring-primary/12">
                <UserCircle className="size-20" aria-hidden="true" />
              </span>
            )}
            <h2 className="mt-4 text-lg font-extrabold text-foreground">{form.name || 'Seu perfil'}</h2>
            <p className="mt-1 max-w-72 text-sm font-semibold text-muted-foreground">{form.email}</p>
          </div>

          <div className="mt-5 grid gap-2">
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
            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              Use PNG, JPG, WEBP ou GIF de ate 1 MB.
            </p>
          </div>
        </div>

        <div className="grid gap-5">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Mail className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-base font-extrabold text-foreground">Dados de acesso</h2>
                <p className="text-xs font-semibold text-muted-foreground">Nome e e-mail usados no painel.</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nome" required htmlFor="profile-name">
                <TextInput
                  id="profile-name"
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  autoComplete="name"
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

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <KeyRound className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-base font-extrabold text-foreground">Senha</h2>
                <p className="text-xs font-semibold text-muted-foreground">Confirme a senha atual antes de definir uma nova.</p>
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

          <div className="flex justify-end">
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
