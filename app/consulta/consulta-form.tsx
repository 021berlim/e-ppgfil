'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CalendarClock, CircleAlert, Download, LoaderCircle, Search, Send } from 'lucide-react'
import { FormCard } from '@/components/public-shell'
import { Field, TextInput } from '@/components/form-field'
import { UploadAnexos } from '@/components/anexos'
import { ConfirmacaoModal } from '@/components/confirmacao-modal'
import { StatusBadge } from '@/components/status-badge'
import { Timeline } from '@/components/timeline'
import {
  formatarCPF,
  formatarData,
  prazoPrevisto,
  soDigitos,
} from '@/lib/store'
import { STATUS_FINAIS, type Anexo, type Protocolo } from '@/lib/types'
import { baixarComprovantePDF } from '@/lib/gerar-comprovante-pdf'
import { obterPrazoDescricaoTipo } from '@/lib/categorias'
import { adicionarAndamentoRemoto, consultarProtocoloRemoto } from '@/lib/protocolos-client'
import { ProtocolDetailSkeleton } from '@/components/loading-skeletons'

export function ConsultaForm() {
  const [cpf, setCpf] = useState('')
  const [numero, setNumero] = useState('')
  const [resultado, setResultado] = useState<Protocolo | null>(null)
  const [erro, setErro] = useState('')
  const [anexos, setAnexos] = useState<Anexo[]>([])
  const [erroAnexos, setErroAnexos] = useState('')
  const [confirmarEnvio, setConfirmarEnvio] = useState(false)
  const [consultando, setConsultando] = useState(false)
  const consultaEmCurso = useRef(false)

  useEffect(() => {
    const protocolo = new URLSearchParams(window.location.search).get('protocolo')
    if (protocolo) setNumero(protocolo)
  }, [])

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (consultaEmCurso.current) return
    setErro('')
    setResultado(null)
    setAnexos([])
    setErroAnexos('')

    if (soDigitos(cpf).length !== 11) {
      setErro('Informe os 11 dígitos do CPF.')
      return
    }
    if (!numero.trim()) {
      setErro('Informe o número do protocolo.')
      return
    }

    consultaEmCurso.current = true
    setConsultando(true)
    try {
      const achado = await consultarProtocoloRemoto(cpf, numero)
      setResultado(achado)
    } catch {
      setErro(
        'Nenhum protocolo encontrado com esse CPF e número. Confira os dados e tente novamente.',
      )
    } finally {
      consultaEmCurso.current = false
      setConsultando(false)
    }
  }

  function handleEnviarAnexos() {
    if (!resultado || anexos.length === 0) {
      setErroAnexos('Selecione pelo menos um arquivo para enviar.')
      return
    }
    setErroAnexos('')
    setConfirmarEnvio(true)
  }

  async function confirmarEnvioAnexos() {
    if (!resultado) return
    try {
      await adicionarAndamentoRemoto({
        id: resultado.id,
        message: `Documento enviado pelo solicitante (${anexos.length} anexo(s)).`,
        anexos,
        origin: 'solicitante',
        authorName: resultado.nome,
      })
      const atualizado = await consultarProtocoloRemoto(resultado.cpf, resultado.numero)
      setResultado(atualizado)
      setAnexos([])
      setErroAnexos('')
      setConfirmarEnvio(false)
    } catch (error) {
      setErroAnexos(error instanceof Error ? error.message : 'Nao foi possivel enviar os documentos.')
    }
  }

  const previsaoRetorno = resultado ? prazoPrevisto(resultado) : null

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/"
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar ao início
      </Link>

      <FormCard
        titulo="Consultar Protocolo"
        descricao="Informe o CPF do solicitante e o número gerado na abertura da solicitação."
      >
        <form onSubmit={handleSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
          <Field label="CPF" required htmlFor="cpf-consulta">
            <TextInput
              id="cpf-consulta"
              inputMode="numeric"
              value={formatarCPF(cpf)}
              onChange={(e) => setCpf(soDigitos(e.target.value))}
              placeholder="000.000.000-00"
            />
          </Field>

          <Field label="Número de protocolo" required htmlFor="numero-consulta">
            <TextInput
              id="numero-consulta"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="PPGFIL-000001/2026"
              className="font-mono"
            />
          </Field>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={consultando}
              aria-busy={consultando}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-extrabold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {consultando ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Search className="size-4" aria-hidden="true" />}
              Consultar
            </button>
          </div>
        </form>

        {erro && (
          <p
            role="alert"
            className="mt-5 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm font-semibold leading-relaxed text-destructive"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {erro}
          </p>
        )}
      </FormCard>

      {consultando && <ProtocolDetailSkeleton />}

      {resultado && (
        <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-secondary/50 px-6 py-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Protocolo
              </p>
              <p className="font-mono text-xl font-extrabold text-primary">{resultado.numero}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => baixarComprovantePDF(resultado)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-bold text-foreground transition hover:border-primary/40 hover:text-primary shadow-2xs"
                title="Baixar comprovante oficial de protocolo em PDF"
              >
                <Download className="size-3.5" aria-hidden="true" />
                <span>Baixar comprovante PDF</span>
              </button>
              <StatusBadge status={resultado.status} />
              {resultado.subetapaExigencia === 'respondida' && (
                <span className="rounded-full border border-[#B7791F]/40 bg-[#B7791F]/12 px-2.5 py-1 text-xs font-extrabold text-[#79500F]">
                  Aguardando conferência
                </span>
              )}
            </div>
          </div>

          <dl className="grid gap-px bg-border sm:grid-cols-3">
            {[
              ['Solicitante', resultado.nome],
              ['CPF', formatarCPF(resultado.cpf)],
              ['Categoria', resultado.categoria],
              ['Tipo de solicitação', resultado.tipo],
              ['Aberto em', formatarData(resultado.criadoEm)],
              ['Última movimentação', formatarData(resultado.atualizadoEm)],
            ].map(([k, v]) => (
              <div key={k} className="bg-card px-6 py-4">
                <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {k}
                </dt>
                <dd className="mt-0.5 text-sm font-semibold text-foreground">{v}</dd>
              </div>
            ))}
          </dl>

          {!STATUS_FINAIS.includes(resultado.status) && (
            <div className="flex items-start gap-3 border-t border-border bg-secondary/40 px-6 py-4">
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <CalendarClock className="size-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-extrabold text-foreground">
                  {previsaoRetorno
                    ? `Previsão de retorno: ${previsaoRetorno.toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}`
                    : obterPrazoDescricaoTipo(resultado.tipo) ??
                      'Prazo não especificado em fonte oficial'}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {previsaoRetorno
                    ? 'Estimativa calculada com base no prazo configurado para este tipo de solicitação.'
                    : 'Consulte a secretaria ou o calendário acadêmico quando aplicável.'}
                </p>
              </div>
            </div>
          )}

          {resultado.resumo && (
            <div className="border-t border-border px-6 py-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Resumo enviado
              </p>
              <p className="mt-1 text-sm leading-relaxed text-foreground">{resultado.resumo}</p>
            </div>
          )}

          <div className="border-t border-border px-6 py-6">
            <h2 className="mb-4 text-base font-extrabold text-foreground">
              Histórico de andamento
            </h2>
            <Timeline historico={resultado.historico} exibirAutor={false} />
          </div>

          {resultado.status === 'Com exigência' && resultado.subetapaExigencia !== 'respondida' && (
            <div className="border-t border-border bg-secondary/25 px-6 py-5">
              <h2 className="text-base font-extrabold text-foreground">
                Enviar documentação pendente
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Anexe os documentos solicitados pela secretaria. O envio será registrado no
                histórico deste protocolo.
              </p>
              <div className="mt-4 grid gap-3">
                <UploadAnexos anexos={anexos} onChange={setAnexos} compact />
                {erroAnexos && (
                  <p role="alert" className="text-xs font-bold text-destructive">
                    {erroAnexos}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleEnviarAnexos}
                  className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground shadow-sm transition hover:opacity-90"
                >
                  <Send className="size-4" aria-hidden="true" />
                  Enviar documentos
                </button>
              </div>
            </div>
          )}
        </section>
      )}
      <ConfirmacaoModal
        aberto={confirmarEnvio}
        titulo="Enviar documentação pendente?"
        descricao="Os arquivos serão vinculados ao protocolo e encaminhados para conferência da secretaria."
        textoConfirmar="Enviar documentos"
        onCancelar={() => setConfirmarEnvio(false)}
        onConfirmar={confirmarEnvioAnexos}
      />
    </div>
  )
}
