import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'
import { listProtocolAssignees } from '@/lib/users-admin'

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Erro inesperado.'
  return NextResponse.json({ error: message }, { status: 400 })
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Acesso nao autorizado.' }, { status: 401 })
    }
    const rows = await listProtocolAssignees()
    return NextResponse.json(rows)
  } catch (error) {
    return errorResponse(error)
  }
}
