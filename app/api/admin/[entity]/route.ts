import { NextResponse } from 'next/server'
import {
  createEntity,
  deleteEntity,
  listEntity,
  updateEntity,
  type EntityName,
} from '@/lib/institutional-admin'
import { requireWriteAdmin } from '@/lib/auth-server'

const ENTITIES = new Set<EntityName>([
  'research-lines',
  'faculty-members',
  'procedures',
  'institutional-forms',
])

function parseEntity(value: string): EntityName {
  if (!ENTITIES.has(value as EntityName)) {
    throw new Error('Cadastro administrativo desconhecido.')
  }
  return value as EntityName
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Erro inesperado.'
  return NextResponse.json({ error: message }, { status: 400 })
}

export async function GET(_request: Request, context: { params: Promise<{ entity: string }> }) {
  try {
    const params = await context.params
    const entity = parseEntity(params.entity)
    const rows = await listEntity(entity)
    return NextResponse.json(rows)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request, context: { params: Promise<{ entity: string }> }) {
  try {
    await requireWriteAdmin()
    const params = await context.params
    const entity = parseEntity(params.entity)
    const payload = await request.json()
    const row = await createEntity(entity, payload)
    return NextResponse.json(row, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PUT(request: Request, context: { params: Promise<{ entity: string }> }) {
  try {
    await requireWriteAdmin()
    const params = await context.params
    const entity = parseEntity(params.entity)
    const payload = await request.json()
    if (typeof payload.id !== 'string') {
      throw new Error('ID ausente para atualizacao.')
    }
    const row = await updateEntity(entity, payload.id, payload)
    if (!row) {
      return NextResponse.json({ error: 'Registro nao encontrado.' }, { status: 404 })
    }
    return NextResponse.json(row)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ entity: string }> }) {
  try {
    await requireWriteAdmin()
    const params = await context.params
    const entity = parseEntity(params.entity)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      throw new Error('ID ausente para exclusao.')
    }
    const deleted = await deleteEntity(entity, id)
    if (!deleted) {
      return NextResponse.json({ error: 'Registro nao encontrado.' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}
