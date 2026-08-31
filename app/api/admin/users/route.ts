import { NextResponse } from 'next/server'
import {
  createDashboardUser,
  deleteDashboardUser,
  listDashboardUsers,
  updateDashboardUser,
} from '@/lib/users-admin'
import { requireCreateUsers, requireManageUsers } from '@/lib/auth-server'

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Erro inesperado.'
  return NextResponse.json({ error: message }, { status: 400 })
}

export async function GET() {
  try {
    await requireManageUsers()
    const rows = await listDashboardUsers()
    return NextResponse.json(rows)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    await requireCreateUsers()
    const payload = await request.json()
    const row = await createDashboardUser(payload)
    return NextResponse.json(row, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PUT(request: Request) {
  try {
    await requireManageUsers()
    const payload = await request.json()
    if (typeof payload.id !== 'string') {
      throw new Error('ID ausente para atualizacao.')
    }
    const row = await updateDashboardUser(payload.id, payload)
    if (!row) {
      return NextResponse.json({ error: 'Usuario nao encontrado.' }, { status: 404 })
    }
    return NextResponse.json(row)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(request: Request) {
  try {
    await requireManageUsers()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      throw new Error('ID ausente para exclusao.')
    }
    const deleted = await deleteDashboardUser(id)
    if (!deleted) {
      return NextResponse.json({ error: 'Usuario nao encontrado.' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}
