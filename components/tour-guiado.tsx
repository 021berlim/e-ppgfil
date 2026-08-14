'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'

export type TourStep = {
  alvo: string
  titulo: string
  texto: string
  posicao?: 'top' | 'bottom' | 'left' | 'right'
  animacao?: 'arrastar'
}

type Retangulo = { top: number; left: number; width: number; height: number }

const MARGEM = 8
const BALAO_LARGURA = 360
const BALAO_ALTURA_ESTIMADA = 230

export function TourGuiado({
  aberto,
  passos,
  onFinalizar,
}: {
  aberto: boolean
  passos: TourStep[]
  onFinalizar: () => void
}) {
  const [indice, setIndice] = useState(0)
  const [alvo, setAlvo] = useState<Retangulo | null>(null)
  const passo = passos[indice]

  const atualizarAlvo = useCallback(() => {
    const passo = passos[indice]
    const elemento = passo ? document.querySelector<HTMLElement>(passo.alvo) : null
    if (!elemento) {
      setAlvo(null)
      return
    }
    const rect = elemento.getBoundingClientRect()
    setAlvo({
      top: Math.max(0, rect.top - MARGEM),
      left: Math.max(0, rect.left - MARGEM),
      width: Math.min(window.innerWidth, rect.width + MARGEM * 2),
      height: Math.min(window.innerHeight, rect.height + MARGEM * 2),
    })
  }, [indice, passos])

  useEffect(() => {
    if (!aberto) {
      setIndice(0)
      setAlvo(null)
      return
    }
    const passo = passos[indice]
    const elemento = passo ? document.querySelector<HTMLElement>(passo.alvo) : null
    if (elemento) {
      const rect = elemento.getBoundingClientRect()
      const foraDaTela = rect.top < 0 || rect.bottom > window.innerHeight
      if (foraDaTela) elemento.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' })
    }
    atualizarAlvo()
    const frame = window.requestAnimationFrame(atualizarAlvo)
    const timer = window.setTimeout(atualizarAlvo, 40)
    window.addEventListener('resize', atualizarAlvo)
    window.addEventListener('scroll', atualizarAlvo, true)
    return () => {
      window.clearTimeout(timer)
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', atualizarAlvo)
      window.removeEventListener('scroll', atualizarAlvo, true)
    }
  }, [aberto, indice, passos, atualizarAlvo])

  useEffect(() => {
    if (!aberto || passo?.animacao !== 'arrastar') return
    const elemento = document.querySelector<HTMLElement>(passo.alvo)
    elemento?.classList.add('tour-demonstrar-arraste')
    return () => elemento?.classList.remove('tour-demonstrar-arraste')
  }, [aberto, passo])

  const posicaoBalao = useMemo(() => posicionarBalao(alvo, passo?.posicao), [alvo, passo])

  if (!aberto || !passo) return null

  function proximo() {
    if (indice === passos.length - 1) onFinalizar()
    else setIndice((atual) => atual + 1)
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[90]" aria-label="Tutorial guiado">
      {alvo ? (
        <>
          <div className="pointer-events-auto fixed left-0 right-0 top-0" style={{ height: alvo.top }} />
          <div className="pointer-events-auto fixed bottom-0 left-0 right-0" style={{ top: alvo.top + alvo.height }} />
          <div className="pointer-events-auto fixed left-0" style={{ top: alvo.top, width: alvo.left, height: alvo.height }} />
          <div className="pointer-events-auto fixed right-0" style={{ top: alvo.top, left: alvo.left + alvo.width, height: alvo.height }} />
          <div
            className="pointer-events-none fixed rounded-xl border-2 border-accent transition-all duration-200 ease-out"
            style={{
              ...alvo,
              boxShadow:
                '0 0 0 4px rgba(201,162,39,0.22), 0 0 0 9999px rgba(0,0,0,0.65)',
            }}
          />
        </>
      ) : (
        <div className="pointer-events-auto fixed inset-0 bg-black/65" />
      )}

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-titulo"
        className="pointer-events-auto fixed w-[min(22.5rem,calc(100vw-2rem))] rounded-2xl border border-primary/25 bg-card p-5 shadow-2xl transition-all duration-200 ease-out"
        style={posicaoBalao}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary">
              {indice + 1} de {passos.length}
            </p>
            <h2 id="tour-titulo" className="mt-1 text-lg font-extrabold text-foreground">
              {passo.titulo}
            </h2>
          </div>
          <button type="button" onClick={onFinalizar} aria-label="Pular tutorial" className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{passo.texto}</p>
        <div className="mt-5 h-1 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${((indice + 1) / passos.length) * 100}%` }} />
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={onFinalizar} className="text-xs font-bold text-muted-foreground hover:text-primary">Pular tutorial</button>
          <div className="flex gap-2">
            {indice > 0 && (
              <button type="button" onClick={() => setIndice((atual) => atual - 1)} className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-extrabold text-foreground hover:bg-secondary">
                <ArrowLeft className="size-3.5" aria-hidden="true" /> Anterior
              </button>
            )}
            <button type="button" onClick={proximo} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-extrabold text-primary-foreground hover:opacity-90">
              {indice === passos.length - 1 ? 'Concluir' : 'Próximo'}
              {indice < passos.length - 1 && <ArrowRight className="size-3.5" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

function posicionarBalao(alvo: Retangulo | null, preferencia: TourStep['posicao']) {
  if (!alvo || typeof window === 'undefined') {
    return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
  }
  const espaco = {
    top: alvo.top,
    bottom: window.innerHeight - alvo.top - alvo.height,
    left: alvo.left,
    right: window.innerWidth - alvo.left - alvo.width,
  }
  const ordem = [preferencia, 'bottom', 'top', 'right', 'left'].filter(Boolean) as Array<keyof typeof espaco>
  const lado = ordem.find((item, i) => ordem.indexOf(item) === i && espaco[item] >= (item === 'left' || item === 'right' ? BALAO_LARGURA + 20 : BALAO_ALTURA_ESTIMADA + 20)) ?? 'bottom'
  let left = alvo.left
  let top = alvo.top + alvo.height + 14
  if (lado === 'top') top = alvo.top - BALAO_ALTURA_ESTIMADA - 14
  if (lado === 'right') {
    left = alvo.left + alvo.width + 14
    top = alvo.top
  }
  if (lado === 'left') {
    left = alvo.left - BALAO_LARGURA - 14
    top = alvo.top
  }
  left = Math.max(16, Math.min(left, window.innerWidth - BALAO_LARGURA - 16))
  top = Math.max(16, Math.min(top, window.innerHeight - BALAO_ALTURA_ESTIMADA - 16))
  return { left, top, transform: 'none' }
}
