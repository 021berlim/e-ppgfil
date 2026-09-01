'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usuarioAtual } from '@/lib/store'
import type { Protocolo } from '@/lib/types'
import { listarProtocolosRemoto } from '@/lib/protocolos-client'

const inFlight = new Map<boolean, Promise<Protocolo[]>>()
let cachePorTipo = new Map<boolean, { data: Protocolo[]; timestamp: number }>()

export function invalidarCacheProtocolos() {
  cachePorTipo.clear()
}

export function useProtocolos({ incluirArquivados = false }: { incluirArquivados?: boolean } = {}) {
  const [protocolos, setProtocolos] = useState<Protocolo[]>(() => {
    const cached = cachePorTipo.get(incluirArquivados)
    return cached ? cached.data : []
  })
  const [carregado, setCarregado] = useState(() => cachePorTipo.has(incluirArquivados))
  const [carregando, setCarregando] = useState(() => !cachePorTipo.has(incluirArquivados))
  const [erro, setErro] = useState<string | null>(null)
  const requisicoesAtivas = useRef(0)

  const refresh = useCallback(async (forcar = false) => {
    const cached = cachePorTipo.get(incluirArquivados)
    if (!forcar && cached && Date.now() - cached.timestamp < 3000) {
      setProtocolos(cached.data)
      setCarregado(true)
      setCarregando(false)
      return
    }

    requisicoesAtivas.current += 1
    if (!cached) setCarregando(true)
    setErro(null)

    try {
      let promise = inFlight.get(incluirArquivados)
      if (!promise) {
        promise = listarProtocolosRemoto(incluirArquivados).finally(() => {
          inFlight.delete(incluirArquivados)
        })
        inFlight.set(incluirArquivados, promise)
      }

      const dados = await promise
      cachePorTipo.set(incluirArquivados, { data: dados, timestamp: Date.now() })
      setProtocolos(dados)
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
      const tarefa = refresh(true)
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
