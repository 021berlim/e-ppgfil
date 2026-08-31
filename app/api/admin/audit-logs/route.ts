import { NextResponse } from 'next/server'
import { requireViewAuditLogs } from '@/lib/auth-server'
import { listarAuditoria } from '@/lib/audit-server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    await requireViewAuditLogs()
    const rows = await listarAuditoria()
    return NextResponse.json(rows)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
