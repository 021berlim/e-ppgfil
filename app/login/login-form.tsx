'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Lock, ShieldCheck } from 'lucide-react'
import { EpfilLogo } from '@/components/epfil-logo'
import { Field, TextInput } from '@/components/form-field'
import { login } from '@/lib/store'
import type { ClientSession } from '@/lib/auth-types'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    setErro('')
    if (!email.trim() || !senha.trim()) {
      setErro('Preencha e-mail e senha.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setErro('Informe um e-mail válido.')
      return
    }

    setCarregando(true)
    try {
      const resposta = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: senha }),
      })
      const dados = await resposta.json().catch(() => null)
      if (!resposta.ok) {
        throw new Error(dados?.error ?? 'Não foi possível entrar.')
      }
      login(dados as ClientSession)
      router.push('/admin/protocolos')
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível entrar.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <aside className="hidden flex-col justify-between bg-primary px-10 py-12 lg:flex">
        <EpfilLogo variant="light" size="md" />
        <div>
          <h2 className="text-balance text-3xl font-extrabold leading-tight text-primary-foreground">
            Área interna do Programa de Pós-Graduação em Filosofia
          </h2>
          <p className="mt-4 max-w-md text-pretty text-sm leading-relaxed text-primary-foreground/75">
            Gestão da esteira de protocolos, registro de andamentos e consulta aos procedimentos
            internos do PPGFIL.
          </p>
        </div>
        <p className="text-xs font-semibold text-primary-foreground/60">
          Universidade do Estado do Rio de Janeiro
        </p>
      </aside>

      <main className="flex flex-col justify-center px-5 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition hover:text-primary"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Voltar ao portal público
          </Link>

          <div className="lg:hidden">
            <EpfilLogo size="md" />
          </div>

          <h1 className="mt-6 text-2xl font-extrabold text-foreground">Acesso restrito</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Uso exclusivo da secretaria e da coordenação.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-7 grid gap-5">
            <Field label="E-mail" required htmlFor="email">
              <TextInput
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="secretaria@ppgfil.uerj.br"
                autoComplete="email"
              />
            </Field>

            <Field label="Senha" required htmlFor="senha">
              <TextInput
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </Field>

            {erro && (
              <p role="alert" className="text-xs font-bold text-destructive">
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-extrabold text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              <Lock className="size-4" aria-hidden="true" />
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="mt-8 flex items-start gap-2 rounded-xl border border-border bg-secondary/60 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            Autenticação própria do e-PPGFIL. As senhas são conferidas no servidor e armazenadas
            apenas como hash.
          </p>
        </div>
      </main>
    </div>
  )
}
