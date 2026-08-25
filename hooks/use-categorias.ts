'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  lerCategorias,
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
    setCarregado(true)
    const unsubscribe = subscribeCategorias(refresh)
    return () => {
      unsubscribe()
    }
  }, [refresh])

  return { categorias, carregado, refresh }
}
