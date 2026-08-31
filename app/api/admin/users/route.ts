import { NextResponse } from 'next/server'
import {
  createDashboardUser,
  deleteDashboardUser,
  listDashboardUsers,
  updateDashboardUser,
} from '@/lib/users-admin'
import { requireCreateUsers, requireManageUsers } from '@/lib/auth-server'
import { registrarAuditoria } from '@/lib/audit-server'
import { recordEmailDelivery } from '@/lib/email/delivery-log'
import { sendWelcomeEmail } from '@/lib/email/senders'

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
    const actor = await requireCreateUsers()
    const payload = await request.json()
    const row = await createDashboardUser(payload)
    const loginUrl = new URL('/login', process.env.APP_BASE_URL || request.url).toString()
    const emailResult = await sendWelcomeEmail(row.email, {
      userName: row.name,
      loginUrl,
    })
    await recordEmailDelivery({
      eventType: 'welcome',
      recipientEmail: row.email,
      userId: row.id,
      result: emailResult,
    })
    await registrarAuditoria({
      actor: { type: 'user', user: actor },
      category: 'sistema',
      action: 'usuario_criado',
      details: {
        userId: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        emailStatus: emailResult.status,
        emailError: emailResult.error,
      },
    })
    return NextResponse.json({ ...row, emailStatus: emailResult.status }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PUT(request: Request) {
  try {
    const actor = await requireManageUsers()
    const payload = await request.json()
    if (typeof payload.id !== 'string') {
      throw new Error('ID ausente para atualizacao.')
    }
    const row = await updateDashboardUser(payload.id, payload)
    if (!row) {
      return NextResponse.json({ error: 'Usuario nao encontrado.' }, { status: 404 })
    }
    await registrarAuditoria({
      actor: { type: 'user', user: actor },
      category: 'sistema',
      action: 'usuario_atualizado',
      details: {
        userId: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        isActive: row.is_active,
        passwordChanged: Boolean(payload.password),
      },
    })
    return NextResponse.json(row)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(request: Request) {
  try {
    const actor = await requireManageUsers()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      throw new Error('ID ausente para exclusao.')
    }
    const deleted = await deleteDashboardUser(id)
    if (!deleted) {
      return NextResponse.json({ error: 'Usuario nao encontrado.' }, { status: 404 })
    }
    const auditActor =
      actor.id === id
        ? ({ type: 'requester' as const, label: actor.name || actor.email })
        : ({ type: 'user' as const, user: actor })
    await registrarAuditoria({
      actor: auditActor,
      category: 'sistema',
      action: 'usuario_excluido',
      details: { userId: id },
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}
