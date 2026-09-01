'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  lerCategorias,
  hidratarCategorias,
  subscribeCategorias,
  type CategoriaItem,
} from '@/lib/categorias'

export function useCategorias() {
  const [categorias, setCategorias] = useState<CategoriaItem[]>([])
  const [carregado, setCarregado] = useState(false)

  const refresh = useCallback(() => {
    setCategorias(lerCategorias())
  }, [])

  useEffect(() => {
    refresh()
    void fetch('/api/categorias', { cache: 'no-store' })
      .then((resposta) => (resposta.ok ? resposta.json() : null))
      .then((dados) => {
        if (Array.isArray(dados)) hidratarCategorias(dados)
      })
      .catch((erro) => console.warn('[API] Usando cache local de categorias:', erro))
      .finally(() => setCarregado(true))
    const unsubscribe = subscribeCategorias(refresh)
    return () => {
      unsubscribe()
    }
  }, [refresh])

  return { categorias, carregado, refresh }
}
