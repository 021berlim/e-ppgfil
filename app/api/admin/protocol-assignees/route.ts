import { NextResponse } from 'next/server'
import { requireWriteAdmin } from '@/lib/auth-server'
import { listProtocolAssignees } from '@/lib/users-admin'

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Erro inesperado.'
  return NextResponse.json({ error: message }, { status: 400 })
}

export async function GET() {
  try {
    await requireWriteAdmin()
    const rows = await listProtocolAssignees()
    return NextResponse.json(rows)
  } catch (error) {
    return errorResponse(error)
  }
}
