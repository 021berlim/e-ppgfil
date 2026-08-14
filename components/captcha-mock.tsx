'use client'

import { forwardRef, useImperativeHandle, useState } from 'react'
import { CircleAlert, RotateCcw } from 'lucide-react'
import { TextInput } from '@/components/form-field'

// Caracteres sem ambiguidade visual (sem 0/O, 1/I/L).
const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function gerarCodigo(tamanho = 6) {
  let out = ''
  for (let i = 0; i < tamanho; i++) {
    out += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return out
}

export type CaptchaHandle = { validar: () => boolean }

/*
 * Captcha funcional: gera um código aleatório a cada carregamento e a cada troca.
 * A validação real acontece no submit, via ref (método `validar`).
 */
export const CaptchaMock = forwardRef<CaptchaHandle>(function CaptchaMock(_props, ref) {
  const [codigo, setCodigo] = useState(() => gerarCodigo())
  const [valor, setValor] = useState('')
  const [erro, setErro] = useState('')

  function trocar() {
    setCodigo(gerarCodigo())
    setValor('')
    setErro('')
  }

  useImperativeHandle(
    ref,
    () => ({
      validar() {
        if (valor.trim().toUpperCase() !== codigo.toUpperCase()) {
          setErro('Código incorreto. Geramos um novo código — digite-o novamente.')
          setCodigo(gerarCodigo())
          setValor('')
          return false
        }
        setErro('')
        return true
      },
    }),
    [valor, codigo],
  )

  return (
    <div className="grid gap-2">
      <span className="text-sm font-bold text-foreground">Verificação de segurança</span>
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="relative grid h-12 w-36 place-items-center overflow-hidden rounded-xl border border-border bg-secondary select-none"
          aria-hidden="true"
        >
          <span
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'repeating-linear-gradient(38deg, transparent 0 6px, #6B1E2C22 6px 7px), repeating-linear-gradient(-52deg, transparent 0 9px, #2B2B2B22 9px 10px)',
            }}
          />
          <span
            className="relative font-mono text-xl font-extrabold tracking-[0.22em] text-primary"
            style={{ transform: 'skewX(-8deg)' }}
          >
            {codigo}
          </span>
        </div>
        <button
          type="button"
          onClick={trocar}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground transition hover:border-primary/40 hover:text-primary"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Trocar código
        </button>
      </div>
      <TextInput
        id="captcha"
        value={valor}
        onChange={(e) => {
          setValor(e.target.value)
          if (erro) setErro('')
        }}
        placeholder="Digite o código exibido acima"
        aria-label="Código de verificação"
        aria-invalid={erro ? true : undefined}
        className="sm:max-w-xs"
      />
      {erro && (
        <p role="alert" className="flex items-center gap-1.5 text-xs font-bold text-destructive">
          <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
          {erro}
        </p>
      )}
    </div>
  )
})
