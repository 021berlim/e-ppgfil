import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'
import { updateOwnProfile } from '@/lib/profile'

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 })
    }

    const payload = await request.json()
    const updated = await updateOwnProfile(user, payload)
    return NextResponse.json(updated)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
