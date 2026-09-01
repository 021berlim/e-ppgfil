'use client'

import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { BadgeCheck, Camera, Eye, EyeOff, KeyRound, LoaderCircle, Mail, Save, Trash2, UserCircle } from 'lucide-react'
import { Field, TextInput } from '@/components/form-field'
import { toast } from '@/components/toast'
import { EpfilLogo } from '@/components/epfil-logo'
import { login, usuarioAtualInfo } from '@/lib/store'
import { DASHBOARD_ROLE_LABELS, type ClientSession } from '@/lib/auth-types'
import { FormSkeleton } from '@/components/loading-skeletons'

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
  const [savingAvatar, setSavingAvatar] = useState(false)
  const [savingEmail, setSavingEmail] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const avatarEmCurso = useRef(false)
  const emailEmCurso = useRef(false)
  const senhaEmCurso = useRef(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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
        void saveAvatarUrl(reader.result)
      }
    }
    reader.onerror = () => toast('Nao foi possivel ler a imagem.')
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  async function saveProfile(payload: Pick<FormState, 'email' | 'avatar_url'> & Partial<Pick<FormState, 'currentPassword' | 'newPassword'>>) {
    const updated = await requestJson<ClientSession>('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    login(updated)
    setForm((current) => ({
      ...current,
      name: updated.name ?? '',
      email: updated.email,
      avatar_url: updated.avatar_url ?? null,
      role: updated.role,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }))
    return updated
  }

  async function saveAvatarUrl(avatarUrl: string | null) {
    if (avatarEmCurso.current) return
    avatarEmCurso.current = true
    const avatarAnterior = form.avatar_url
    updateField('avatar_url', avatarUrl)
    setSavingAvatar(true)
    try {
      await saveProfile({
        email: form.email,
        avatar_url: avatarUrl,
      })
      toast('Foto de perfil atualizada.')
    } catch (error) {
      updateField('avatar_url', avatarAnterior)
      toast(error instanceof Error ? error.message : 'Erro ao salvar foto.')
    } finally {
      avatarEmCurso.current = false
      setSavingAvatar(false)
    }
  }

  async function saveEmail(event: React.FormEvent) {
    event.preventDefault()
    if (emailEmCurso.current) return
    emailEmCurso.current = true
    setSavingEmail(true)
    try {
      await saveProfile({
        email: form.email,
        avatar_url: form.avatar_url,
      })
      toast('E-mail atualizado.')
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Erro ao salvar e-mail.')
    } finally {
      emailEmCurso.current = false
      setSavingEmail(false)
    }
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault()
    if (senhaEmCurso.current) return
    if (form.newPassword !== form.confirmPassword) {
      toast('A confirmacao da nova senha nao confere.')
      return
    }

    senhaEmCurso.current = true
    setSavingPassword(true)
    try {
      await saveProfile({
        email: form.email,
        avatar_url: form.avatar_url,
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      })
      toast('Senha atualizada.')
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Erro ao alterar senha.')
    } finally {
      senhaEmCurso.current = false
      setSavingPassword(false)
    }
  }

  if (loading) {
    return <FormSkeleton />
  }

  return (
    <section className="px-6 py-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="relative grid min-h-52 place-items-center bg-[#601a27] px-5 py-7 sm:px-7">
            <EpfilLogo variant="light" size="md" className="w-full max-w-xs justify-center opacity-95 sm:max-w-sm" />
          </div>

          <div className="relative px-5 pb-7 sm:px-7">
            <div className="-mt-20 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="relative w-fit">
                  {form.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.avatar_url}
                      alt=""
                      loading="lazy"
                      decoding="async"
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

                <div className="min-w-0 pt-1 sm:pt-20">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="max-w-full break-words text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                      {form.name || 'Seu perfil'}
                    </h2>
                    <BadgeCheck className="size-5 shrink-0 text-accent" aria-hidden="true" />
                  </div>
                  <p className="mt-1 break-all text-sm font-bold leading-relaxed text-muted-foreground">{form.email}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-extrabold text-primary">
                      {form.role ? DASHBOARD_ROLE_LABELS[form.role] : 'Dashboard'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-foreground shadow-sm transition hover:opacity-90">
                  {savingAvatar ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Camera className="size-4" aria-hidden="true" />}
                  Alterar foto
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleAvatarChange}
                    disabled={savingAvatar}
                    className="sr-only"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void saveAvatarUrl(null)}
                  disabled={savingAvatar}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground transition hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Remover foto
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <form onSubmit={saveEmail} className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="grid gap-6">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Mail className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-base font-extrabold text-foreground">Dados de acesso</h2>
                </div>
              </div>

              <div className="grid max-w-4xl gap-4">
                <div className="grid gap-4">
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <label htmlFor="profile-name" className="block truncate text-sm font-bold leading-snug text-foreground">
                      Nome
                    </label>
                    <TextInput
                      id="profile-name"
                      value={form.name}
                      disabled
                      className="bg-secondary/70 text-muted-foreground disabled:cursor-not-allowed disabled:opacity-100"
                    />
                  </div>
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
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingEmail}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-extrabold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingEmail ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
                    Salvar e-mail
                  </button>
                </div>
              </div>
            </div>
          </form>

          <form onSubmit={savePassword} className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="grid gap-6">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <KeyRound className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-base font-extrabold text-foreground">Seguranca</h2>
                </div>
              </div>

              <div className="grid max-w-4xl gap-4">
                <Field label="Senha atual" required htmlFor="current-password">
                  <PasswordInput
                    id="current-password"
                    value={form.currentPassword}
                    onChange={(event) => updateField('currentPassword', event.target.value)}
                    show={showCurrentPassword}
                    onToggle={() => setShowCurrentPassword((current) => !current)}
                    autoComplete="current-password"
                    required
                  />
                </Field>
                <Field label="Nova senha" required htmlFor="new-password" hint="Use pelo menos 8 caracteres.">
                  <PasswordInput
                    id="new-password"
                    value={form.newPassword}
                    onChange={(event) => updateField('newPassword', event.target.value)}
                    show={showNewPassword}
                    onToggle={() => setShowNewPassword((current) => !current)}
                    autoComplete="new-password"
                    required
                  />
                </Field>
                <Field label="Confirmar nova senha" required htmlFor="confirm-password">
                  <PasswordInput
                    id="confirm-password"
                    value={form.confirmPassword}
                    onChange={(event) => updateField('confirmPassword', event.target.value)}
                    show={showConfirmPassword}
                    onToggle={() => setShowConfirmPassword((current) => !current)}
                    autoComplete="new-password"
                    required
                  />
                </Field>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-extrabold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingPassword ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
                    Alterar senha
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

function PasswordInput({
  show,
  onToggle,
  ...props
}: React.ComponentProps<'input'> & {
  show: boolean
  onToggle: () => void
}) {
  return (
    <div className="relative">
      <TextInput
        {...props}
        type={show ? 'text' : 'password'}
        className="pr-12"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        aria-label={show ? 'Ocultar senha' : 'Visualizar senha'}
      >
        {show ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
      </button>
    </div>
  )
}
