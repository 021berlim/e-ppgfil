import { NextResponse } from 'next/server'
import { requireManageUsers } from '@/lib/auth-server'
import { listDashboardRoles } from '@/lib/users-admin'

export async function GET() {
  try {
    await requireManageUsers()
    const rows = await listDashboardRoles()
    return NextResponse.json(rows)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
