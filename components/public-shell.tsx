import type React from 'react'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import { EpfilLogo } from '@/components/epfil-logo'

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/" aria-label="Página inicial do e-PPGFIL">
            <EpfilLogo size="sm" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-foreground transition hover:border-primary/40 hover:text-primary"
          >
            <Lock className="size-3.5" aria-hidden="true" />
            Acesso restrito
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">{children}</main>

      <footer className="border-t border-border bg-card/60">
        <div className="mx-auto w-full max-w-5xl px-5 py-6 text-xs leading-relaxed text-muted-foreground">
          <p className="font-bold text-foreground">
            PPGFIL — Programa de Pós-Graduação em Filosofia
          </p>
          <p>
            Universidade do Estado do Rio de Janeiro · Contato:{' '}
            <a href="mailto:posfil@gmail.com" className="font-semibold text-primary underline-offset-2 hover:underline">
              posfil@gmail.com
            </a>
          </p>
          <p className="mt-2">Protótipo de interface — dados armazenados apenas neste navegador.</p>
        </div>
      </footer>
    </div>
  )
}

export function FormCard({
  titulo,
  descricao,
  children,
}: {
  titulo: string
  descricao?: string
  children: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-md">
      <div className="bg-primary px-6 py-5 sm:px-8">
        <h1 className="text-xl font-extrabold text-primary-foreground sm:text-2xl">{titulo}</h1>
        {descricao && (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-primary-foreground/80">
            {descricao}
          </p>
        )}
      </div>
      <div className="px-6 py-6 sm:px-8 sm:py-8">{children}</div>
    </section>
  )
}
