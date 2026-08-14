import Link from 'next/link'
import { ArrowRight, CircleHelp, Files, FileText, LifeBuoy, Search } from 'lucide-react'
import { EpfilLogo } from '@/components/epfil-logo'
import { PublicShell } from '@/components/public-shell'

const opcoes = [
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
    descricao: 'Respostas rápidas sobre prazos, anexos e acompanhamento das solicitações.',
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
    <PublicShell>
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-col items-center text-center">
          <EpfilLogo size="lg" showSub={false} className="flex-col gap-4" />
          <h1 className="mt-6 text-balance text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Sistema de solicitações do PPGFIL
          </h1>
          <p className="mt-3 max-w-lg text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            Canal oficial de abertura e acompanhamento de solicitações do Programa de
            Pós-Graduação em Filosofia da UERJ. Selecione uma opção abaixo.
          </p>
        </div>

        <nav aria-label="Serviços disponíveis" className="mt-10 grid gap-4">
          {opcoes.map((o) => (
            <Link
              key={o.href}
              href={o.href}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <o.icone className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-extrabold text-foreground">{o.titulo}</span>
                <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">
                  {o.descricao}
                </span>
              </span>
              <ArrowRight
                className="size-5 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary"
                aria-hidden="true"
              />
            </Link>
          ))}
        </nav>

        <p className="mt-8 rounded-2xl border border-border bg-secondary/60 px-5 py-4 text-xs leading-relaxed text-muted-foreground">
          A abertura e a consulta de solicitações não exigem cadastro nem senha. O CPF informado no
          formulário é o único dado usado para localizar o protocolo depois.
        </p>
      </div>
    </PublicShell>
  )
}
