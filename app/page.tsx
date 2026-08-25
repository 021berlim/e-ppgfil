import Link from 'next/link'
import {
  ArrowRight,
  CircleHelp,
  Files,
  FileText,
  LifeBuoy,
  Search,
  ShieldCheck,
} from 'lucide-react'
import { EpfilLogo } from '@/components/epfil-logo'
import { PublicShell } from '@/components/public-shell'

const opcoesPrincipais = [
  {
    href: '/solicitacao',
    icone: FileText,
    titulo: 'Abrir Solicitação',
    descricao:
      'Registre um novo pedido junto à secretaria do PPGFIL e receba um número de protocolo.',
  },
  {
    href: '/consulta',
    icone: Search,
    titulo: 'Consultar Protocolo',
    descricao: 'Acompanhe o andamento do seu pedido com CPF e número de protocolo.',
  },
]

const opcoesSecundarias = [
  {
    href: '/formularios',
    icone: Files,
    titulo: 'Formulários',
    descricao: 'Acesse e baixe os formulários oficiais disponibilizados pelo PPGFIL.',
  },
  {
    href: '/faq',
    icone: CircleHelp,
    titulo: 'Dúvidas frequentes',
    descricao: 'Respostas rápidas sobre prazos, anexos e acompanhamento.',
  },
  {
    href: '/suporte',
    icone: LifeBuoy,
    titulo: 'Suporte',
    descricao: 'Dúvidas sobre o sistema ou dificuldades de acesso? Fale com a secretaria.',
  },
]

export default function HomePage() {
  return (
    <PublicShell compact>
      <div className="mx-auto flex w-full max-w-4xl flex-col justify-center gap-3.5 sm:gap-4.5">
        <div className="flex flex-col items-center text-center">
          <EpfilLogo size="md" showSub={true} className="gap-2.5" />
          <h1 className="mt-2 text-balance text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            Sistema de solicitações do PPGFIL
          </h1>
          <p className="mt-1 max-w-xl text-pretty text-xs leading-relaxed text-muted-foreground sm:text-sm">
            Canal oficial de abertura e acompanhamento de solicitações do Programa de
            Pós-Graduação em Filosofia da UERJ. Selecione uma opção abaixo.
          </p>
        </div>

        <nav aria-label="Serviços disponíveis" className="flex flex-col gap-3">
          {/* Ações principais */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {opcoesPrincipais.map((o) => (
              <Link
                key={o.href}
                href={o.href}
                className="group relative flex items-center gap-3.5 rounded-xl border border-primary/25 bg-card p-3.5 shadow-xs transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md sm:p-4"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <o.icone className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-1">
                    <span className="block text-sm font-extrabold text-foreground sm:text-base">
                      {o.titulo}
                    </span>
                    <ArrowRight
                      className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-muted-foreground line-clamp-2">
                    {o.descricao}
                  </span>
                </span>
              </Link>
            ))}
          </div>

          {/* Ações secundárias */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {opcoesSecundarias.map((o) => (
              <Link
                key={o.href}
                href={o.href}
                className="group flex items-start gap-3 rounded-xl border border-border bg-card p-3 shadow-xs transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <o.icone className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-1">
                    <span className="block text-xs font-bold text-foreground sm:text-sm">
                      {o.titulo}
                    </span>
                    <ArrowRight
                      className="size-3.5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-tight text-muted-foreground sm:text-xs line-clamp-2">
                    {o.descricao}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </nav>

        <div className="flex items-center gap-2.5 rounded-xl border border-border bg-secondary/60 px-3.5 py-2 text-xs leading-snug text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden="true" />
          <p>
            A abertura e a consulta de solicitações não exigem cadastro nem senha. O CPF informado no
            formulário é o único dado usado para localizar o protocolo depois.
          </p>
        </div>
      </div>
    </PublicShell>
  )
}
