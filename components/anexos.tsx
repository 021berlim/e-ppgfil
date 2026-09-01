'use client'

import { useRef, useState } from 'react'
import { CircleCheck, Download, Loader2, Paperclip, Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatarTamanho } from '@/lib/store'
import { enviarDocumentoR2 } from '@/lib/documentos-r2-client'
import type { Anexo } from '@/lib/types'
import type { DocumentoExigido } from '@/lib/categorias'

export function AnexoChip({
  anexo,
  onRemove,
}: {
  anexo: Anexo
  onRemove?: () => void
}) {
  const [baixando, setBaixando] = useState(false)
  const downloadEmCurso = useRef(false)

  async function baixarAnexo() {
    if (downloadEmCurso.current) return
    if (!anexo.documentFileId) {
      alert(
        `Arquivo sem armazenamento configurado\n\nArquivo: ${anexo.nome}\nTipo: ${anexo.tipo}\nTamanho: ${formatarTamanho(anexo.tamanho)}`,
      )
      return
    }

    downloadEmCurso.current = true
    setBaixando(true)
    try {
      const params = new URLSearchParams()
      if (anexo.downloadToken) params.set('token', anexo.downloadToken)
      const resposta = await fetch(
        `/api/documents/${anexo.documentFileId}/download?${params.toString()}`,
      )
      const dados = (await resposta.json()) as { url?: string; error?: string }
      if (!resposta.ok || !dados.url) {
        throw new Error(dados.error ?? 'Nao foi possivel gerar o link de download.')
      }
      window.open(dados.url, '_blank', 'noopener,noreferrer')
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Nao foi possivel baixar o arquivo.')
    } finally {
      downloadEmCurso.current = false
      setBaixando(false)
    }
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
          disabled={baixando}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-card px-2.5 py-1.5 font-extrabold text-primary shadow-sm transition hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          aria-label={`Baixar anexo ${anexo.nome}`}
          title="Baixar arquivo"
        >
          {baixando ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="size-3.5" aria-hidden="true" />
          )}
          {baixando ? 'Gerando link' : 'Baixar'}
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
  const [enviando, setEnviando] = useState(false)
  const uploadEmCurso = useRef(false)
  const [erroUpload, setErroUpload] = useState('')

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return
    if (uploadEmCurso.current) return
    uploadEmCurso.current = true
    setEnviando(true)
    setErroUpload('')
    try {
      const enviados = await Promise.all(Array.from(files).map(enviarDocumentoR2))
      onChange([...anexos, ...enviados])
    } catch (error) {
      setErroUpload(error instanceof Error ? error.message : 'Nao foi possivel enviar o arquivo.')
    } finally {
      uploadEmCurso.current = false
      setEnviando(false)
      if (inputRef.current) inputRef.current.value = ''
    }
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
        disabled={enviando}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-border bg-secondary/40 text-left transition hover:border-primary/50 hover:bg-secondary',
          enviando && 'cursor-wait opacity-70',
          compact ? 'px-3 py-2.5' : 'px-4 py-4',
        )}
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
          {enviando ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Upload className="size-4" aria-hidden="true" />
          )}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-bold text-foreground">
            {enviando ? 'Enviando arquivo' : compact ? 'Anexar arquivo' : 'Selecionar arquivos'}
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
      {erroUpload && (
        <p role="alert" className="text-xs font-bold text-destructive">
          {erroUpload}
        </p>
      )}
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

export function ChecklistDocumentos({
  documentos,
  anexosPorDocumento,
  onChange,
  erroObrigatorios,
}: {
  documentos: DocumentoExigido[]
  anexosPorDocumento: Record<string, Anexo | undefined>
  onChange: (documentoId: string, anexo: Anexo | undefined) => void
  erroObrigatorios?: string
}) {
  const [errosArquivo, setErrosArquivo] = useState<Record<string, string>>({})
  const [enviandoDocumento, setEnviandoDocumento] = useState<Record<string, boolean>>({})
  const uploadsEmCurso = useRef(new Set<string>())
  const obrigatorios = documentos.filter((documento) => documento.obrigatorio)
  const obrigatoriosAnexados = obrigatorios.filter(
    (documento) => anexosPorDocumento[documento.id],
  ).length

  async function selecionarArquivo(documento: DocumentoExigido, arquivo?: File) {
    if (!arquivo) return
    if (uploadsEmCurso.current.has(documento.id)) return
    const extensao = arquivo.name.split('.').pop()?.toLowerCase() ?? ''
    const formatos = documento.formatosAceitos.map((formato) =>
      formato.toLowerCase().replace(/^\./, ''),
    )
    if (!formatos.includes(extensao)) {
      setErrosArquivo((atuais) => ({
        ...atuais,
        [documento.id]: `Formato inválido. Use ${formatos.join(', ').toUpperCase()}.`,
      }))
      return
    }
    if (arquivo.size > documento.tamanhoMaximoMB * 1024 * 1024) {
      setErrosArquivo((atuais) => ({
        ...atuais,
        [documento.id]: `O arquivo deve ter no máximo ${documento.tamanhoMaximoMB} MB.`,
      }))
      return
    }
    setErrosArquivo((atuais) => ({ ...atuais, [documento.id]: '' }))
    uploadsEmCurso.current.add(documento.id)
    setEnviandoDocumento((atuais) => ({ ...atuais, [documento.id]: true }))
    try {
      const anexo = await enviarDocumentoR2(arquivo)
      onChange(documento.id, anexo)
    } catch (error) {
      setErrosArquivo((atuais) => ({
        ...atuais,
        [documento.id]:
          error instanceof Error ? error.message : 'Nao foi possivel enviar o arquivo.',
      }))
    } finally {
      uploadsEmCurso.current.delete(documento.id)
      setEnviandoDocumento((atuais) => ({ ...atuais, [documento.id]: false }))
    }
  }

  return (
    <section className="grid gap-3" aria-labelledby="documentos-exigidos-titulo">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 id="documentos-exigidos-titulo" className="text-sm font-bold text-foreground">
            Documentos da solicitação
          </h3>
          <p className="text-xs text-muted-foreground">Envie um arquivo em cada item abaixo.</p>
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-extrabold text-foreground">
          {obrigatoriosAnexados} de {obrigatorios.length} obrigatórios anexados
        </span>
      </div>

      {erroObrigatorios && (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
          {erroObrigatorios}
        </p>
      )}

      <div className="grid gap-3">
        {documentos.map((documento) => {
          const anexo = anexosPorDocumento[documento.id]
          const enviando = enviandoDocumento[documento.id] ?? false
          const inputId = `documento-${documento.id}`
          return (
            <article key={documento.id} className="rounded-xl border border-border bg-secondary/30 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <label htmlFor={inputId} className="text-sm font-extrabold text-foreground">
                      {documento.nome}
                    </label>
                    <span className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide',
                      documento.obrigatorio
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-muted text-muted-foreground',
                    )}>
                      {documento.obrigatorio ? 'Obrigatório' : 'Opcional'}
                    </span>
                  </div>
                  {documento.descricao && (
                    <p className="mt-1 text-xs text-muted-foreground">{documento.descricao}</p>
                  )}
                  <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
                    {documento.formatosAceitos.map((formato) => formato.toUpperCase()).join(', ')} · até {documento.tamanhoMaximoMB} MB
                  </p>
                </div>
                {enviando ? (
                  <Loader2 className="size-5 shrink-0 animate-spin text-primary" aria-label="Enviando arquivo" />
                ) : (
                  anexo && <CircleCheck className="size-5 shrink-0 text-[#2d5540]" aria-label="Arquivo anexado" />
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label
                  htmlFor={inputId}
                  className={cn(
                    'inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-extrabold text-primary transition hover:border-primary/40',
                    enviando && 'pointer-events-none cursor-wait opacity-70',
                  )}
                >
                  {enviando ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Upload className="size-3.5" aria-hidden="true" />
                  )}
                  {enviando ? 'Enviando arquivo' : anexo ? 'Substituir arquivo' : 'Selecionar arquivo'}
                </label>
                <input
                  id={inputId}
                  type="file"
                  accept={documento.formatosAceitos.map((formato) => `.${formato.replace(/^\./, '')}`).join(',')}
                  className="sr-only"
                  disabled={enviando}
                  onChange={(evento) => {
                    selecionarArquivo(documento, evento.target.files?.[0])
                    evento.target.value = ''
                  }}
                />
                {anexo && (
                  <>
                    <span className="max-w-xs truncate text-xs font-semibold text-foreground">{anexo.nome}</span>
                    <button type="button" onClick={() => onChange(documento.id, undefined)} className="text-xs font-bold text-destructive hover:underline">
                      Remover
                    </button>
                  </>
                )}
              </div>
              {errosArquivo[documento.id] && (
                <p role="alert" className="mt-2 text-xs font-bold text-destructive">{errosArquivo[documento.id]}</p>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
