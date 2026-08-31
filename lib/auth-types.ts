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
  role: DashboardRole
  em: number
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
