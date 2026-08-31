import { NextResponse } from 'next/server'
import { authenticateDashboardUser } from '@/lib/auth-server'

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const email = typeof payload.email === 'string' ? payload.email.trim() : ''
    const password = typeof payload.password === 'string' ? payload.password : ''

    if (!email || !password) {
      return NextResponse.json({ error: 'Informe e-mail e senha.' }, { status: 400 })
    }

    const session = await authenticateDashboardUser(email, password)
    if (!session) {
      return NextResponse.json({ error: 'Credenciais invalidas.' }, { status: 401 })
    }

    return NextResponse.json(session)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
