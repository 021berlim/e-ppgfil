import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'
import { getProtocolById } from '@/lib/protocols-server'

export const runtime = 'nodejs'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    const { id } = await context.params
    if (!id) {
      return NextResponse.json({ error: 'Identificador ausente.' }, { status: 400 })
    }

    const protocolo = await getProtocolById(id)
    if (!protocolo) {
      return NextResponse.json({ error: 'Protocolo nao encontrado.' }, { status: 404 })
    }

    return NextResponse.json(protocolo)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
