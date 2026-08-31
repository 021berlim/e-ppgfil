import { NextResponse } from 'next/server'
import { requireWriteAdmin } from '@/lib/auth-server'
import { registrarAuditoria } from '@/lib/audit-server'
import { db } from '@/lib/db'
import { deleteR2Object } from '@/lib/r2'

export const runtime = 'nodejs'

function errorResponse(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : 'Erro inesperado.'
  return NextResponse.json({ error: message }, { status })
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireWriteAdmin()
    const { id } = await context.params
    const result = await db.query(
      `
        SELECT r2_key
        FROM public.document_files
        WHERE id = $1
          AND status <> 'deleted'
        LIMIT 1
      `,
      [id],
    )

    const file = result.rows[0]
    if (!file) return NextResponse.json({ error: 'Documento nao encontrado.' }, { status: 404 })

    await deleteR2Object(file.r2_key)
    await db.query(`UPDATE public.document_files SET status = 'deleted' WHERE id = $1`, [id])
    await registrarAuditoria({
      actor: { type: 'user', user: actor },
      category: 'documento',
      action: 'documento_excluido',
      documentFileId: id,
      details: { r2Key: file.r2_key },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}
