'use client'

import { useEffect, useState, useCallback } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ProtocoloDetalhes } from '../protocolo-modal'
import { FormSkeleton } from '@/components/loading-skeletons'
import { obterProtocoloPorIdRemoto } from '@/lib/protocolos-client'
import type { Protocolo } from '@/lib/types'

export function DetalhesProtocoloPage({ id }: { id: string }) {
  const router = useRouter()
  const [protocolo, setProtocolo] = useState<Protocolo | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    try {
      setCarregando(true)
      setErro(null)
      const dados = await obterProtocoloPorIdRemoto(id)
      setProtocolo(dados)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Protocolo nao encontrado.')
      setProtocolo(null)
    } finally {
      setCarregando(false)
    }
  }, [id])

  useEffect(() => {
    void carregar()

    const handleRefresh = () => {
      void carregar()
    }
    window.addEventListener('epfil:protocolos-refresh', handleRefresh)
    return () => {
      window.removeEventListener('epfil:protocolos-refresh', handleRefresh)
    }
  }, [carregar])

  const voltar = () =>
    router.push(protocolo?.arquivado ? '/admin/protocolos/arquivados' : '/admin/protocolos')

  if (carregando) return <FormSkeleton />

  if (erro || !protocolo) {
    return (
      <main className="grid min-h-[60dvh] place-items-center px-6 py-10">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <h1 className="text-xl font-extrabold text-foreground">Protocolo não encontrado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {erro ?? 'Este protocolo pode ter sido removido ou o endereço informado está incorreto.'}
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
