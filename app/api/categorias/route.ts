import { promises as fs } from 'node:fs'
import path from 'node:path'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const arquivoCategorias = path.join(process.cwd(), 'data', 'categorias-solicitacoes.json')

function respostaErro(mensagem: string, status = 500) {
  return NextResponse.json({ erro: mensagem }, { status })
}

export async function GET() {
  try {
    const conteudo = await fs.readFile(arquivoCategorias, 'utf8')
    return NextResponse.json(JSON.parse(conteudo))
  } catch (erro) {
    console.error('[API categorias] Erro ao ler JSON:', erro)
    return respostaErro('Não foi possível ler as categorias.')
  }
}

export async function PUT(request: Request) {
  try {
    const dados: unknown = await request.json()
    if (!Array.isArray(dados)) return respostaErro('O corpo deve ser uma lista de categorias.', 400)
    if (dados.some((item) => !item || typeof item !== 'object' || !('id' in item) || !('tiposSolicitacao' in item))) {
      return respostaErro('Categoria inválida.', 400)
    }
    await fs.writeFile(arquivoCategorias, `${JSON.stringify(dados, null, 2)}\n`, 'utf8')
    return NextResponse.json(dados)
  } catch (erro) {
    console.error('[API categorias] Erro ao gravar JSON:', erro)
    return respostaErro('Não foi possível persistir as categorias.')
  }
}
