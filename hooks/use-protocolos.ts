'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usuarioAtual } from '@/lib/store'
import type { Protocolo } from '@/lib/types'
import { listarProtocolosRemoto } from '@/lib/protocolos-client'

export function useProtocolos({ incluirArquivados = false }: { incluirArquivados?: boolean } = {}) {
  const [protocolos, setProtocolos] = useState<Protocolo[]>([])
  const [carregado, setCarregado] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const requisicoesAtivas = useRef(0)

  const refresh = useCallback(async () => {
    requisicoesAtivas.current += 1
    setCarregando(true)
    setErro(null)
    try {
      setProtocolos(await listarProtocolosRemoto(incluirArquivados))
    } catch (error) {
      setProtocolos([])
      setErro(error instanceof Error ? error.message : 'Nao foi possivel carregar protocolos.')
    } finally {
      requisicoesAtivas.current -= 1
      setCarregado(true)
      if (requisicoesAtivas.current === 0) setCarregando(false)
    }
  }, [incluirArquivados])

  useEffect(() => {
    void refresh()
    const handleRefresh = (event: Event) => {
      const tarefa = refresh()
      const detail = (event as CustomEvent<{ waitUntil?: (promise: Promise<void>) => void }>).detail
      detail?.waitUntil?.(tarefa)
    }
    window.addEventListener('epfil:protocolos-refresh', handleRefresh)
    return () => {
      window.removeEventListener('epfil:protocolos-refresh', handleRefresh)
    }
  }, [refresh])

  return { protocolos, carregado, carregando, erro, refresh }
}

export function useAuth() {
  const [usuario, setUsuario] = useState<string | null>(null)
  const [verificado, setVerificado] = useState(false)

  useEffect(() => {
    setUsuario(usuarioAtual())
    setVerificado(true)
  }, [])

  return { usuario, verificado, setUsuario }
}
