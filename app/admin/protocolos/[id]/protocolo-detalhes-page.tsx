'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useProtocolos } from '@/hooks/use-protocolos'
import { ProtocoloDetalhes } from '../protocolo-modal'

export function DetalhesProtocoloPage({ id }: { id: string }) {
  const router = useRouter()
  const { protocolos, carregado } = useProtocolos({ incluirArquivados: true })
  const protocolo = protocolos.find((item) => item.id === id)
  const voltar = () =>
    router.push(protocolo?.arquivado ? '/admin/protocolos/arquivados' : '/admin/protocolos')

  if (!carregado) {
    return (
      <div className="grid min-h-[50dvh] place-items-center px-6">
        <p className="text-sm font-bold text-muted-foreground">Carregando protocolo…</p>
      </div>
    )
  }

  if (!protocolo) {
    return (
      <main className="grid min-h-[60dvh] place-items-center px-6 py-10">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <h1 className="text-xl font-extrabold text-foreground">Protocolo não encontrado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Este protocolo pode ter sido removido ou o endereço informado está incorreto.
          </p>
          <button
            type="button"
            onClick={voltar}
            className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Voltar à esteira
          </button>
        </div>
      </main>
    )
  }

  return <ProtocoloDetalhes protocolo={protocolo} onVoltar={voltar} />
}
