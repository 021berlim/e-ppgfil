import { NextResponse } from 'next/server'
import { requireViewAuditLogs } from '@/lib/auth-server'
import { listarAuditoria } from '@/lib/audit-server'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    await requireViewAuditLogs()
    const { searchParams } = new URL(request.url)
    const pagina = parseInt(searchParams.get('pagina') || searchParams.get('page') || '1', 10)
    const limite = parseInt(searchParams.get('limite') || searchParams.get('limit') || '50', 10)
    const busca = searchParams.get('busca') || searchParams.get('search') || undefined
    const categoria = searchParams.get('categoria') || searchParams.get('category') || undefined

    const result = await listarAuditoria({ pagina, limite, busca, categoria })
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
