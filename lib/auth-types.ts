export const DASHBOARD_ROLES = [
  'ROOT',
  'SECRETARY_ADMIN',
  'SECRETARY_OPERATOR',
  'COORDINATOR',
] as const

export type DashboardRole = (typeof DASHBOARD_ROLES)[number]

export type ClientSession = {
  id?: string
  email: string
  name?: string
  avatar_url?: string | null
  role: DashboardRole
  em: number
}

export const DASHBOARD_ROLE_LABELS: Record<DashboardRole, string> = {
  ROOT: 'Administrador do Sistema',
  SECRETARY_ADMIN: 'Chefe de secretaria',
  SECRETARY_OPERATOR: 'Secretario',
  COORDINATOR: 'Coordenador',
}

export function isCoordinator(role?: string | null) {
  return role === 'COORDINATOR'
}

export function canWriteAdmin(role?: string | null) {
  return role === 'ROOT' || role === 'SECRETARY_ADMIN' || role === 'SECRETARY_OPERATOR'
}

export function canManageUsers(role?: string | null) {
  return role === 'ROOT' || role === 'SECRETARY_ADMIN'
}

export function canManageAdministrativeCatalogs(role?: string | null) {
  return role === 'ROOT' || role === 'SECRETARY_ADMIN'
}

export function canCreateUsers(role?: string | null) {
  return role === 'ROOT'
}
