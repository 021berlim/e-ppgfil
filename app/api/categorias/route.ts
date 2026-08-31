import { NextResponse } from 'next/server'
import { requireManageAdministrativeCatalogs } from '@/lib/auth-server'
import { registrarAuditoria } from '@/lib/audit-server'
import { listRequestCatalog, replaceRequestCatalog } from '@/lib/request-catalog-server'

export const runtime = 'nodejs'

function respostaErro(mensagem: string, status = 500) {
  return NextResponse.json({ erro: mensagem }, { status })
}

export async function GET() {
  try {
    return NextResponse.json(await listRequestCatalog())
  } catch (erro) {
    console.error('[API categorias] Erro ao ler JSON:', erro)
    return respostaErro('Não foi possível ler as categorias.')
  }
}

export async function PUT(request: Request) {
  try {
    const actor = await requireManageAdministrativeCatalogs()
    const dados: unknown = await request.json()
    const catalogo = await replaceRequestCatalog(dados)
    await registrarAuditoria({
      actor: { type: 'user', user: actor },
      category: 'sistema',
      action: 'categorias_atualizadas',
      details: { totalCategorias: catalogo.length },
    })
    return NextResponse.json(catalogo)
  } catch (erro) {
    console.error('[API categorias] Erro ao gravar JSON:', erro)
    return respostaErro('Não foi possível persistir as categorias.')
  }
}
