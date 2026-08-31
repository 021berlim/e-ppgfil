'use client'

import type {
  Anexo,
  Protocolo,
} from './types'
import type { ClientSession, DashboardRole } from './auth-types'
import { STATUS_FINAIS } from './types'
import { obterPrazoSlaTipo } from './categorias'

export const AUTH_KEY = 'epfil:auth'

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

export function formatarCPF(cpf: string) {
  const d = cpf.replace(/\D/g, '').slice(0, 11)
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})$/, '$1.$2.$3-$4')
}

export function soDigitos(v: string) {
  return v.replace(/\D/g, '')
}

export function formatarData(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatarDataCurta(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  })
}

/* ----- Prazo / SLA em dias úteis ----- */

export function adicionarDiasUteis(base: Date, dias: number): Date {
  const d = new Date(base)
  let restantes = dias
  while (restantes > 0) {
    d.setDate(d.getDate() + 1)
    const diaSemana = d.getDay()
    if (diaSemana !== 0 && diaSemana !== 6) restantes--
  }
  return d
}

export function prazoPrevisto(p: Protocolo): Date | null {
  const dias = obterPrazoSlaTipo(p.tipo)
  return dias ? adicionarDiasUteis(new Date(p.criadoEm), dias) : null
}

export function estaAtrasado(p: Protocolo): boolean {
  if (STATUS_FINAIS.includes(p.status)) return false
  const prazo = prazoPrevisto(p)
  return prazo ? Date.now() > prazo.getTime() : false
}

export function formatarTamanho(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function arquivoParaAnexo(file: File): Anexo {
  return { id: uid(), nome: file.name, tipo: file.type || 'arquivo', tamanho: file.size }
}

/* auth propria */
export function login(session: ClientSession | string) {
  const payload =
    typeof session === 'string'
      ? { email: session, role: 'SECRETARY_ADMIN' as DashboardRole, em: Date.now() }
      : session
  window.localStorage.setItem(AUTH_KEY, JSON.stringify(payload))
}

export function logout() {
  window.localStorage.removeItem(AUTH_KEY)
  void fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined)
}

export function usuarioAtualInfo(): ClientSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(AUTH_KEY)
    if (!raw) return null
    const sessao = JSON.parse(raw) as Partial<ClientSession> & { usuario?: string }
    const email = sessao.email ?? sessao.usuario
    if (!email) return null
    return {
      id: sessao.id,
      email,
      name: sessao.name,
      avatar_url: sessao.avatar_url ?? null,
      role: sessao.role ?? 'SECRETARY_ADMIN',
      em: sessao.em ?? Date.now(),
    }
  } catch {
    return null
  }
}

export function usuarioAtual(): string | null {
  return usuarioAtualInfo()?.email ?? null
}

export function nomeUsuarioAtual(): string | null {
  const sessao = usuarioAtualInfo()
  return sessao?.name || sessao?.email || null
}

export function cargoAtual(): DashboardRole | null {
  return usuarioAtualInfo()?.role ?? null
}
