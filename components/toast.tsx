'use client'

import { useEffect, useState } from 'react'
import { Mail, X } from 'lucide-react'

export type Toast = { id: string; mensagem: string }

const LISTENERS = new Set<(t: Toast[]) => void>()
let TOASTS: Toast[] = []

function emit() {
  LISTENERS.forEach((l) => l(TOASTS))
}

function remover(id: string) {
  TOASTS = TOASTS.filter((t) => t.id !== id)
  emit()
}

/** Dispara um toast genérico. */
export function toast(mensagem: string) {
  const id = Math.random().toString(36).slice(2, 9)
  TOASTS = [...TOASTS, { id, mensagem }]
  emit()
  setTimeout(() => remover(id), 4200)
}

/** Simula o envio de e-mail de atualização ao solicitante (apenas visual). */
export function notificarEmail(nome: string) {
  toast(`E-mail de atualização enviado a ${nome}`)
}

export function Toaster() {
  const [itens, setItens] = useState<Toast[]>(TOASTS)

  useEffect(() => {
    const listener = (t: Toast[]) => setItens([...t])
    LISTENERS.add(listener)
    return () => {
      LISTENERS.delete(listener)
    }
  }, [])

  if (itens.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end"
      role="region"
      aria-label="Notificações"
    >
      {itens.map((t) => (
        <div
          key={t.id}
          role="status"
          className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-lg"
        >
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <Mail className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              Notificação simulada
            </p>
            <p className="mt-0.5 text-sm font-bold leading-snug text-foreground">{t.mensagem}</p>
          </div>
          <button
            type="button"
            onClick={() => remover(t.id)}
            aria-label="Fechar notificação"
            className="grid size-6 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  )
}
