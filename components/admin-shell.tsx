'use client'

import type React from 'react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  LayoutGrid,
  LogOut,
  CircleHelp,
  ScrollText,
  Settings,
  UserCircle,
  Tags,
  Users,
  Workflow,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { EpfilLogo } from '@/components/epfil-logo'
import { Toaster } from '@/components/toast'
import { ConfirmacaoModal } from '@/components/confirmacao-modal'
import { PageSkeleton } from '@/components/loading-skeletons'
import { login, logout, usuarioAtualInfo } from '@/lib/store'
import {
  DASHBOARD_ROLE_LABELS,
  canManageAdministrativeCatalogs,
  canManageUsers,
  canViewAuditLogs,
  type ClientSession,
} from '@/lib/auth-types'

const NAV = [
  {
    grupo: 'Protocolos',
    itens: [
      { href: '/admin/painel', label: 'Painel', icone: BarChart3 },
      { href: '/admin/protocolos', label: 'Esteira de protocolos', icone: LayoutGrid },
    ],
  },
  {
    grupo: 'Configuração',
    itens: [
      { href: '/admin/usuarios', label: 'Usuários', icone: Users },
      { href: '/admin/categorias', label: 'Categorias e Serviços', icone: Tags },
      { href: '/admin/auditoria', label: 'Auditoria', icone: ScrollText },
    ],
  },
  {
    grupo: 'Informativo',
    itens: [
      { href: '/admin/linhas-de-pesquisa', label: 'Linhas de Pesquisa', icone: Workflow },
      { href: '/admin/corpo-docente', label: 'Corpo Docente', icone: Users },
      { href: '/admin/procedimentos', label: 'Procedimentos Internos', icone: BookOpen },
      { href: '/admin/documentos', label: 'Documentos', icone: FolderOpen },
    ],
  },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [sessao, setSessao] = useState<ClientSession | null>(null)
  const [pronto, setPronto] = useState(false)
  const [confirmarSaida, setConfirmarSaida] = useState(false)
  const [sidebarRecolhida, setSidebarRecolhida] = useState(false)

  useEffect(() => {
    const local = usuarioAtualInfo()
    if (local) setSessao(local)

    fetch('/api/auth/me')
      .then(async (resposta) => {
        if (!resposta.ok) throw new Error('Nao autenticado.')
        const atual = (await resposta.json()) as ClientSession
        login(atual)
        setSessao(atual)
        setPronto(true)
      })
      .catch(() => {
        logout()
        router.replace('/login')
      })
  }, [router])

  useEffect(() => {
    setSidebarRecolhida(window.localStorage.getItem('epfil:sidebar-collapsed') === 'true')
  }, [])

  function alternarSidebar() {
    setSidebarRecolhida((atual) => {
      const novoEstado = !atual
      window.localStorage.setItem('epfil:sidebar-collapsed', String(novoEstado))
      return novoEstado
    })
  }

  function iniciarTutorial() {
    window.dispatchEvent(new Event('epfil:start-tour'))
    const estaNosDetalhes = pathname.startsWith('/admin/protocolos/') &&
      pathname !== '/admin/protocolos/arquivados'
    if (!estaNosDetalhes && pathname !== '/admin/protocolos') {
      window.localStorage.setItem('epfil:tour-requested', 'true')
      router.push('/admin/protocolos')
    }
  }

  const nav = NAV.map((grupo) => ({
    ...grupo,
    itens: grupo.itens.filter((item) => {
      if (item.href === '/admin/usuarios') return canManageUsers(sessao?.role)
      if (item.href === '/admin/categorias') return canManageAdministrativeCatalogs(sessao?.role)
      if (item.href === '/admin/auditoria') return canViewAuditLogs(sessao?.role)
      return true
    }),
  })).filter((grupo) => grupo.itens.length > 0)

  if (!pronto) {
    return <PageSkeleton />
  }

  return (
    <div className="min-h-dvh">
      <aside
        data-tour="admin-sidebar"
        className={cn(
          'relative flex shrink-0 flex-col bg-sidebar transition-[width] duration-200 lg:fixed lg:inset-y-0 lg:left-0 lg:z-30',
          sidebarRecolhida ? 'lg:w-20' : 'lg:w-72',
        )}
      >
        <div className={cn('border-b border-sidebar-border py-5', sidebarRecolhida ? 'lg:px-5' : 'px-6')}>
          <Link href="/admin/protocolos" aria-label="Painel e-PPGFIL">
            <EpfilLogo
              variant="light"
              size="sm"
            />
          </Link>
        </div>

        <button
          type="button"
          onClick={alternarSidebar}
          aria-label={sidebarRecolhida ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          title={sidebarRecolhida ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          className="absolute -right-3 top-5 z-10 hidden size-8 place-items-center rounded-full border border-sidebar-border bg-sidebar-accent text-sidebar-foreground shadow-sm transition hover:brightness-110 focus-visible:ring-4 focus-visible:ring-primary-foreground/20 lg:grid"
        >
          {sidebarRecolhida ? (
            <ChevronRight className="size-4" aria-hidden="true" />
          ) : (
            <ChevronLeft className="size-4" aria-hidden="true" />
          )}
        </button>

        <nav aria-label="Navegação interna" className={cn('flex-1 overflow-y-auto py-5', sidebarRecolhida ? 'lg:px-2' : 'px-3')}>
          {nav.map((g) => (
            <div key={g.grupo} className="mb-5">
              <p className={cn('px-3 pb-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-sidebar-foreground/50', sidebarRecolhida && 'lg:sr-only')}>
                {g.grupo}
              </p>
              <ul className="grid gap-1">
                {g.itens.map((i) => {
                  const ativo = pathname === i.href
                  return (
                    <li key={i.href}>
                      <Link
                        href={i.href}
                        aria-current={ativo ? 'page' : undefined}
                        title={sidebarRecolhida ? i.label : undefined}
                        className={cn(
                          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition',
                          sidebarRecolhida && 'lg:justify-center lg:px-2',
                          ativo
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                        )}
                      >
                        <i.icone className="size-4 shrink-0" aria-hidden="true" />
                        <span className={cn('truncate', sidebarRecolhida && 'lg:sr-only')}>{i.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className={cn('border-t border-sidebar-border py-4', sidebarRecolhida ? 'lg:px-2' : 'px-4')}>
          <div className={cn('flex items-center gap-2 rounded-xl px-2 py-2 text-sidebar-foreground', sidebarRecolhida && 'lg:justify-center lg:px-2')}>
            <Link
              href="/admin/perfil"
              title={sidebarRecolhida ? 'Perfil' : undefined}
              className={cn(
                'flex min-w-0 flex-1 items-center gap-3 rounded-lg transition hover:text-sidebar-accent-foreground',
                sidebarRecolhida && 'lg:flex-none',
              )}
            >
              {sessao?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={sessao.avatar_url}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="size-9 shrink-0 rounded-full object-cover ring-2 ring-sidebar-accent"
                />
              ) : (
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
                  <UserCircle className="size-5" aria-hidden="true" />
                </span>
              )}
              <span className={cn('min-w-0', sidebarRecolhida && 'lg:sr-only')}>
                <span className="block truncate text-xs font-bold">{sessao?.name ?? sessao?.email}</span>
                <span className="block truncate text-[11px] text-sidebar-foreground/60">
                  {sessao?.role ? DASHBOARD_ROLE_LABELS[sessao.role] : 'Dashboard'}
                </span>
              </span>
            </Link>
            <Link
              href="/admin/perfil"
              aria-label="Perfil"
              title="Perfil"
              className={cn(
                'grid size-8 shrink-0 place-items-center rounded-lg text-sidebar-foreground/70 transition hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground focus-visible:ring-4 focus-visible:ring-primary-foreground/20',
                sidebarRecolhida && 'lg:hidden',
              )}
            >
              <Settings className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-3 grid gap-1.5">
            <button
              type="button"
              onClick={iniciarTutorial}
              title={sidebarRecolhida ? 'Ver tutorial' : undefined}
              className={cn('flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold text-sidebar-foreground/75 transition hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground', sidebarRecolhida && 'lg:justify-center lg:px-2')}
            >
              <CircleHelp className="size-3.5" aria-hidden="true" />
              <span className={cn(sidebarRecolhida && 'lg:sr-only')}>Ver tutorial</span>
            </button>
            <button
              type="button"
              onClick={() => setConfirmarSaida(true)}
              title={sidebarRecolhida ? 'Sair' : undefined}
              className={cn('flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold text-sidebar-foreground/75 transition hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground', sidebarRecolhida && 'lg:justify-center lg:px-2')}
            >
              <LogOut className="size-3.5" aria-hidden="true" />
              <span className={cn(sidebarRecolhida && 'lg:sr-only')}>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      <main
        className={cn(
          'min-w-0 overflow-x-hidden bg-background transition-[margin] duration-200 lg:min-h-dvh',
          sidebarRecolhida ? 'lg:ml-20' : 'lg:ml-72',
        )}
      >
        {children}
      </main>
      <Toaster />
      <ConfirmacaoModal
        aberto={confirmarSaida}
        titulo="Sair do sistema?"
        descricao="Sua sessão administrativa será encerrada."
        textoConfirmar="Sair"
        onCancelar={() => setConfirmarSaida(false)}
        onConfirmar={() => {
          logout()
          router.replace('/login')
          setConfirmarSaida(false)
        }}
      />
    </div>
  )
}

export function PageHeader({
  titulo,
  descricao,
  children,
}: {
  titulo: string
  descricao?: string
  children?: React.ReactNode
}) {
  return (
    <header className="shrink-0 border-b border-border bg-card px-6 py-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{titulo}</h1>
          {descricao && (
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {descricao}
            </p>
          )}
        </div>
        {children}
      </div>
    </header>
  )
}
