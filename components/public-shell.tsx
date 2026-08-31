import type React from 'react'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import { EpfilLogo } from '@/components/epfil-logo'
import { CONTATO_PPGFIL } from '@/lib/conteudo-institucional'

type PublicShellProps = {
  children: React.ReactNode
  compact?: boolean
  className?: string
  contentClassName?: string
}

export function PublicShell({
  children,
  compact = false,
  className,
  contentClassName,
}: PublicShellProps) {
  return (
    <div
      className={
        compact
          ? `flex min-h-dvh flex-col justify-between sm:h-dvh sm:max-h-dvh overflow-x-hidden ${className ?? ''}`
          : `flex min-h-dvh flex-col ${className ?? ''}`
      }
    >
      <header className="border-b border-border bg-card/80 backdrop-blur shrink-0">
        <div
          className={`mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 ${
            compact ? 'py-2.5 sm:py-3' : 'py-4'
          }`}
        >
          <Link href="/" aria-label="Página inicial do e-PPGFIL">
            <EpfilLogo size="sm" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-bold text-foreground transition hover:border-primary/40 hover:text-primary"
          >
            <Lock className="size-3.5" aria-hidden="true" />
            Acesso restrito
          </Link>
        </div>
      </header>

      <main
        className={`mx-auto w-full max-w-5xl flex-1 px-4 sm:px-6 ${
          compact
            ? 'flex flex-col justify-center py-2 sm:py-4 min-h-0'
            : 'py-10'
        } ${contentClassName ?? ''}`}
      >
        {children}
      </main>

      <footer className="border-t border-border bg-card/60 shrink-0">
        {compact ? (
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-1 px-5 py-2 text-[11px] leading-tight text-muted-foreground sm:flex-row sm:py-2.5">
            <p className="font-bold text-foreground">
              PPGFIL — Programa de Pós-Graduação em Filosofia · UERJ
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              <span>
                Contato:{' '}
                <a
                  href={`mailto:${CONTATO_PPGFIL.email}`}
                  className="font-semibold text-primary underline-offset-2 hover:underline"
                >
                  {CONTATO_PPGFIL.email}
                </a>
              </span>
              <a href={CONTATO_PPGFIL.ouvidoria} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">Ouvidoria</a>
              <a href={CONTATO_PPGFIL.sic} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">SIC</a>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-5xl px-5 py-6 text-xs leading-relaxed text-muted-foreground">
            <p className="font-bold text-foreground">
              PPGFIL — Programa de Pós-Graduação em Filosofia
            </p>
            <p>
              Universidade do Estado do Rio de Janeiro · IFCH · {CONTATO_PPGFIL.telefone} ·{' '}
              <a
                href={`mailto:${CONTATO_PPGFIL.email}`}
                className="font-semibold text-primary underline-offset-2 hover:underline"
              >
                {CONTATO_PPGFIL.email}
              </a>
            </p>
            <p>{CONTATO_PPGFIL.endereco}</p>
            <p>Atendimento: {CONTATO_PPGFIL.atendimento}</p>
            <div className="mt-2 flex flex-wrap gap-3">
              <a href={CONTATO_PPGFIL.ifch} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">IFCH</a>
              <a href={CONTATO_PPGFIL.ppgfil} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">Site do PPGFIL</a>
              <a href={CONTATO_PPGFIL.ouvidoria} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">Ouvidoria-Geral da UERJ</a>
              <a href={CONTATO_PPGFIL.sic} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">Serviço de Informação ao Cidadão (SIC)</a>
            </div>
          </div>
        )}
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
