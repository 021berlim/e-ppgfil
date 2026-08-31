'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  arquivarFinalizadosAutomaticamente,
  lerProtocolos,
  subscribe,
  usuarioAtual,
} from '@/lib/store'
import type { Protocolo } from '@/lib/types'
import { listarProtocolosRemoto } from '@/lib/protocolos-client'

export function useProtocolos({ incluirArquivados = false }: { incluirArquivados?: boolean } = {}) {
  const [protocolos, setProtocolos] = useState<Protocolo[]>([])
  const [carregado, setCarregado] = useState(false)

  const refresh = useCallback(() => {
    const lista = lerProtocolos()
    setProtocolos(incluirArquivados ? lista : lista.filter((p) => !p.arquivado))
    void listarProtocolosRemoto(incluirArquivados)
      .then(setProtocolos)
      .catch((error) => console.warn('[API] Usando cache local de protocolos:', error))
  }, [incluirArquivados])

  useEffect(() => {
    arquivarFinalizadosAutomaticamente()
    refresh()
    setCarregado(true)
    const unsubscribe = subscribe(refresh)
    window.addEventListener('epfil:protocolos-refresh', refresh)
    const intervalo = window.setInterval(arquivarFinalizadosAutomaticamente, 60 * 60 * 1000)
    return () => {
      unsubscribe()
      window.removeEventListener('epfil:protocolos-refresh', refresh)
      window.clearInterval(intervalo)
    }
  }, [refresh])

  return { protocolos, carregado, refresh }
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
