'use client'

import { useRef } from 'react'
import { Download, Paperclip, Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { arquivoParaAnexo, formatarTamanho } from '@/lib/store'
import type { Anexo } from '@/lib/types'

export function AnexoChip({
  anexo,
  onRemove,
}: {
  anexo: Anexo
  onRemove?: () => void
}) {
  function baixarAnexo() {
    alert(
      `Download simulado\n\nArquivo: ${anexo.nome}\nTipo: ${anexo.tipo}\nTamanho: ${formatarTamanho(anexo.tamanho)}`,
    )
  }

  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-xl border border-border bg-secondary/70 py-1.5 pl-3 pr-1.5 text-xs font-semibold text-foreground">
      <Paperclip className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
      <span className="truncate">{anexo.nome}</span>
      <span className="shrink-0 text-muted-foreground">{formatarTamanho(anexo.tamanho)}</span>
      {!onRemove && (
        <button
          type="button"
          onClick={baixarAnexo}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-card px-2.5 py-1.5 font-extrabold text-primary shadow-sm transition hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          aria-label={`Baixar anexo ${anexo.nome}`}
          title="Baixar arquivo"
        >
          <Download className="size-3.5" aria-hidden="true" />
          Baixar
        </button>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="grid size-4 shrink-0 place-items-center rounded-full bg-foreground/10 transition hover:bg-destructive hover:text-primary-foreground"
          aria-label={`Remover anexo ${anexo.nome}`}
        >
          <X className="size-3" aria-hidden="true" />
        </button>
      )}
    </span>
  )
}

export function UploadAnexos({
  anexos,
  onChange,
  label = 'Anexos',
  hint = 'PDF, DOC ou imagens. O armazenamento é simulado neste protótipo.',
  compact = false,
}: {
  anexos: Anexo[]
  onChange: (a: Anexo[]) => void
  label?: string
  hint?: string
  compact?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFiles(files: FileList | null) {
    if (!files?.length) return
    onChange([...anexos, ...Array.from(files).map(arquivoParaAnexo)])
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="grid gap-2">
      {!compact && (
        <label className="text-sm font-bold text-foreground">
          {label} <span className="font-medium text-muted-foreground">(opcional)</span>
        </label>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-border bg-secondary/40 text-left transition hover:border-primary/50 hover:bg-secondary',
          compact ? 'px-3 py-2.5' : 'px-4 py-4',
        )}
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
          <Upload className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-bold text-foreground">
            {compact ? 'Anexar arquivo' : 'Selecionar arquivos'}
          </span>
          {!compact && <span className="block text-xs text-muted-foreground">{hint}</span>}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        aria-label="Selecionar arquivos para anexar"
      />
      {anexos.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {anexos.map((a) => (
            <AnexoChip
              key={a.id}
              anexo={a}
              onRemove={() => onChange(anexos.filter((x) => x.id !== a.id))}
            />
          ))}
        </div>
      )}
    </div>
  )
}
