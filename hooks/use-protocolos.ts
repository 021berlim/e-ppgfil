'use client'

import { useCallback, useEffect, useState } from 'react'
import { usuarioAtual } from '@/lib/store'
import type { Protocolo } from '@/lib/types'
import { listarProtocolosRemoto } from '@/lib/protocolos-client'

export function useProtocolos({ incluirArquivados = false }: { incluirArquivados?: boolean } = {}) {
  const [protocolos, setProtocolos] = useState<Protocolo[]>([])
  const [carregado, setCarregado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setErro(null)
    try {
      setProtocolos(await listarProtocolosRemoto(incluirArquivados))
    } catch (error) {
      setProtocolos([])
      setErro(error instanceof Error ? error.message : 'Nao foi possivel carregar protocolos.')
    } finally {
      setCarregado(true)
    }
  }, [incluirArquivados])

  useEffect(() => {
    void refresh()
    const handleRefresh = () => void refresh()
    window.addEventListener('epfil:protocolos-refresh', handleRefresh)
    return () => {
      window.removeEventListener('epfil:protocolos-refresh', handleRefresh)
    }
  }, [refresh])

  return { protocolos, carregado, erro, refresh }
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
