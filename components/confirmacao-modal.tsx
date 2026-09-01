'use client'

import { useEffect, useRef, useState } from 'react'
import { LoaderCircle, TriangleAlert, X } from 'lucide-react'
import { TextArea } from '@/components/form-field'

export function ConfirmacaoModal({
  aberto,
  titulo,
  descricao,
  textoConfirmar = 'Confirmar',
  tom = 'padrao',
  exigirMotivo = false,
  labelMotivo = 'Motivo',
  placeholderMotivo,
  onCancelar,
  onConfirmar,
}: {
  aberto: boolean
  titulo: string
  descricao: string
  textoConfirmar?: string
  tom?: 'padrao' | 'perigo'
  exigirMotivo?: boolean
  labelMotivo?: string
  placeholderMotivo?: string
  onCancelar: () => void
  onConfirmar: (motivo: string) => void | Promise<void>
}) {
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState('')
  const [processando, setProcessando] = useState(false)
  const processandoRef = useRef(false)

  useEffect(() => {
    if (!aberto) {
      setMotivo('')
      setErro('')
      setProcessando(false)
      processandoRef.current = false
    }
  }, [aberto])

  if (!aberto) return null

  async function confirmar() {
    if (processandoRef.current) return
    if (exigirMotivo && !motivo.trim()) {
      setErro('Informe o motivo antes de continuar.')
      return
    }
    processandoRef.current = true
    setProcessando(true)
    try {
      await onConfirmar(motivo.trim())
    } finally {
      processandoRef.current = false
      setProcessando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-foreground/45 p-4 backdrop-blur-sm" role="presentation">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmacao-titulo"
        aria-describedby="confirmacao-descricao"
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg"
      >
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent/20 text-[#79500F]">
            <TriangleAlert className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="confirmacao-titulo" className="text-lg font-extrabold text-foreground">
              {titulo}
            </h2>
            <p id="confirmacao-descricao" className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {descricao}
            </p>
          </div>
          <button type="button" onClick={onCancelar} disabled={processando} aria-label="Cancelar" className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        {exigirMotivo && (
          <div className="mt-5">
            <label htmlFor="motivo-confirmacao" className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              {labelMotivo}
            </label>
            <TextArea
              id="motivo-confirmacao"
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value)
                if (erro) setErro('')
              }}
              placeholder={placeholderMotivo}
              className="mt-1.5 min-h-28"
              autoFocus
              disabled={processando}
            />
            {erro && <p role="alert" className="mt-1.5 text-xs font-bold text-destructive">{erro}</p>}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancelar} disabled={processando} className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-extrabold text-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50">
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void confirmar()}
            disabled={processando}
            aria-busy={processando}
            className={`inline-flex min-w-28 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-extrabold hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${
              tom === 'perigo'
                ? 'bg-destructive text-destructive-foreground'
                : 'bg-primary text-primary-foreground'
            }`}
          >
            {processando && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}
