'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CircleCheckBig, Copy, Search, Send } from 'lucide-react'
import { FormCard } from '@/components/public-shell'
import { Field, Select, TextArea, TextInput } from '@/components/form-field'
import { UploadAnexos } from '@/components/anexos'
import { CaptchaMock, type CaptchaHandle } from '@/components/captcha-mock'
import { criarProtocolo, formatarCPF, soDigitos } from '@/lib/store'
import type { Anexo, Protocolo } from '@/lib/types'
import { ConfirmacaoModal } from '@/components/confirmacao-modal'
import { useCategorias } from '@/hooks/use-categorias'

type Erros = Partial<Record<'cpf' | 'nome' | 'email' | 'categoria' | 'tipo', string>>

export function SolicitacaoForm() {
  const { categorias } = useCategorias()
  const [cpf, setCpf] = useState('')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [categoria, setCategoria] = useState('')
  const [tipo, setTipo] = useState('')
  const [resumo, setResumo] = useState('')
  const [anexos, setAnexos] = useState<Anexo[]>([])
  const [erros, setErros] = useState<Erros>({})
  const [criado, setCriado] = useState<Protocolo | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [confirmarCriacao, setConfirmarCriacao] = useState(false)
  const captchaRef = useRef<CaptchaHandle>(null)

  const categoriaSelecionada = categorias.find(
    (c) => c.id === categoria || c.nome === categoria,
  )
  const tiposDisponiveis = categoriaSelecionada?.tiposSolicitacao ?? []
  const tipoSelecionado = tiposDisponiveis.find(
    (t) => t.id === tipo || t.nome === tipo,
  )

  function handleCategoriaChange(novaCat: string) {
    setCategoria(novaCat)
    const catObj = categorias.find((c) => c.id === novaCat || c.nome === novaCat)
    const tipos = catObj?.tiposSolicitacao ?? []
    if (!tipos.some((t) => t.nome === tipo || t.id === tipo)) {
      setTipo('')
    }
    if (erros.categoria) {
      setErros((prev) => ({ ...prev, categoria: undefined }))
    }
  }

  function validar(): boolean {
    const e: Erros = {}
    if (soDigitos(cpf).length !== 11) e.cpf = 'Informe os 11 dígitos do CPF.'
    if (nome.trim().split(/\s+/).length < 2)
      e.nome = 'Informe o nome completo, sem abreviações.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()))
      e.email = 'Informe um e-mail válido.'
    if (!categoria) e.categoria = 'Selecione uma categoria.'
    if (!tipo) e.tipo = 'Selecione o tipo de solicitação.'
    setErros(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    const camposOk = validar()
    const captchaOk = captchaRef.current?.validar() ?? false
    if (!camposOk || !captchaOk) return
    setConfirmarCriacao(true)
  }

  function confirmarSolicitacao() {
    const novo = criarProtocolo({
      cpf,
      nome,
      email,
      categoria: categoria as Protocolo['categoria'],
      tipo: tipo as Protocolo['tipo'],
      resumo,
      anexos,
    })
    setCriado(novo)
    setConfirmarCriacao(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (criado) {
    return (
      <div className="mx-auto max-w-2xl">
        <FormCard
          titulo="Solicitação registrada"
          descricao="Guarde o número do protocolo abaixo — ele é necessário para consultar o andamento."
        >
          <div className="flex flex-col items-center text-center">
            <span className="grid size-14 place-items-center rounded-full bg-[#3F7355]/15 text-[#2d5540]">
              <CircleCheckBig className="size-7" aria-hidden="true" />
            </span>
            <p className="mt-4 text-sm font-semibold text-muted-foreground">
              Seu número de protocolo
            </p>
            <p className="mt-1 font-mono text-3xl font-extrabold tracking-tight text-primary">
              {criado.numero}
            </p>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(criado.numero)
                setCopiado(true)
                setTimeout(() => setCopiado(false), 2000)
              }}
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-foreground transition hover:border-primary/40 hover:text-primary"
            >
              <Copy className="size-3.5" aria-hidden="true" />
              {copiado ? 'Copiado!' : 'Copiar número'}
            </button>
          </div>

          <dl className="mt-7 grid gap-px overflow-hidden rounded-xl border border-border bg-border text-sm sm:grid-cols-2">
            {[
              ['Solicitante', criado.nome],
              ['CPF', formatarCPF(criado.cpf)],
              ['E-mail', criado.email],
              ['Categoria', criado.categoria],
              ['Tipo de solicitação', criado.tipo],
              ['Situação', criado.status],
            ].map(([k, v]) => (
              <div key={k} className="bg-card px-4 py-3">
                <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {k}
                </dt>
                <dd className="mt-0.5 font-semibold text-foreground">{v}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-5 rounded-xl border border-border bg-secondary/60 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
            O acompanhamento é feito na tela de consulta, informando o CPF e este número. Cada
            movimentação da secretaria gera um novo registro no histórico.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/consulta"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"
            >
              <Search className="size-4" aria-hidden="true" />
              Consultar andamento
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-bold text-foreground transition hover:border-primary/40 hover:text-primary"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Voltar ao início
            </Link>
          </div>
        </FormCard>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/"
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar ao início
      </Link>

      <FormCard
        titulo="Abrir Solicitação"
        descricao="Preencha os dados abaixo. Ao final, o sistema gera um número de protocolo para acompanhamento."
      >
        <form onSubmit={handleSubmit} noValidate className="grid gap-5">
          <Field label="CPF" required htmlFor="cpf" error={erros.cpf} hint="Apenas números.">
            <TextInput
              id="cpf"
              inputMode="numeric"
              autoComplete="off"
              value={formatarCPF(cpf)}
              onChange={(e) => setCpf(soDigitos(e.target.value))}
              placeholder="000.000.000-00"
            />
          </Field>

          <Field
            label="Nome completo"
            required
            htmlFor="nome"
            error={erros.nome}
            hint="Sem abreviações, conforme documento oficial."
          >
            <TextInput
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Maria Clara Rodrigues Pinto"
            />
          </Field>

          <Field label="E-mail" required htmlFor="email" error={erros.email}>
            <TextInput
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@exemplo.com"
            />
          </Field>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:items-start">
            <Field
              label="Categoria"
              required
              htmlFor="categoria"
              error={erros.categoria}
              hint={categoriaSelecionada?.descricao}
              className="min-w-0"
            >
              <Select
                id="categoria"
                value={categoria}
                onChange={(e) => handleCategoriaChange(e.target.value)}
                className="w-full min-w-0"
              >
                <option value="">Selecione sua categoria…</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.nome}>
                    {c.nome}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Tipo de solicitação"
              required
              htmlFor="tipo"
              error={erros.tipo}
              hint={
                tipoSelecionado
                  ? `${tipoSelecionado.descricao ? `${tipoSelecionado.descricao} ` : ''}(Prazo estimado: ${tipoSelecionado.prazoDias ?? 7} dias úteis)`
                  : categoria
                  ? 'Selecione o tipo de serviço desejado.'
                  : 'Escolha uma categoria primeiro.'
              }
              className="min-w-0"
            >
              <Select
                id="tipo"
                value={tipo}
                onChange={(e) => {
                  setTipo(e.target.value)
                  if (erros.tipo) setErros((prev) => ({ ...prev, tipo: undefined }))
                }}
                disabled={!categoria || tiposDisponiveis.length === 0}
                className="w-full min-w-0"
              >
                <option value="">
                  {!categoria
                    ? 'Selecione primeiro uma categoria…'
                    : tiposDisponiveis.length === 0
                    ? 'Nenhum tipo cadastrado para esta categoria'
                    : 'Selecione o tipo de solicitação…'}
                </option>
                {tiposDisponiveis.map((t) => (
                  <option key={t.id} value={t.nome}>
                    {t.nome} {t.prazoDias ? `(${t.prazoDias} dias)` : ''}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field
            label="Resumo da solicitação"
            htmlFor="resumo"
            hint="Descreva brevemente o pedido para agilizar a análise."
          >
            <TextArea
              id="resumo"
              value={resumo}
              onChange={(e) => setResumo(e.target.value)}
              placeholder="Ex.: Solicito aproveitamento da disciplina cursada como aluno especial em 2024/2."
            />
          </Field>

          <UploadAnexos
            anexos={anexos}
            onChange={setAnexos}
            label="Anexar documentos"
            hint="Os arquivos aparecem no primeiro registro do histórico do protocolo."
          />

          <CaptchaMock ref={captchaRef} />

          <button
            type="submit"
            className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-extrabold text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            <Send className="size-4" aria-hidden="true" />
            Enviar Solicitação
          </button>
        </form>
      </FormCard>
      <ConfirmacaoModal
        aberto={confirmarCriacao}
        titulo="Enviar solicitação?"
        descricao="Confira os dados informados. Após confirmar, um novo protocolo será registrado."
        textoConfirmar="Enviar solicitação"
        onCancelar={() => setConfirmarCriacao(false)}
        onConfirmar={confirmarSolicitacao}
      />
    </div>
  )
}
