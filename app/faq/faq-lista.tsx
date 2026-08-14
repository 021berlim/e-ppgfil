'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const PERGUNTAS = [
  {
    q: 'Quanto tempo leva para responderem minha solicitação?',
    a: 'O prazo varia conforme o tipo de solicitação. Matrículas costumam ser respondidas em até 3 dias úteis, enquanto aproveitamento de disciplina pode levar até 10 dias úteis. Na tela de consulta você vê a previsão de retorno do seu protocolo.',
  },
  {
    q: 'Preciso criar cadastro ou senha para abrir um protocolo?',
    a: 'Não. A abertura e a consulta são feitas apenas com o CPF do solicitante e o número de protocolo gerado ao final do envio. Guarde esse número, pois ele é indispensável para acompanhar o andamento.',
  },
  {
    q: 'Posso anexar um documento depois de abrir o protocolo?',
    a: 'A secretaria pode solicitar documentos complementares durante a análise. Nesses casos, o pedido aparece no histórico do protocolo e você deve enviar o documento respondendo ao contato indicado pela secretaria.',
  },
  {
    q: 'O que significa o status "Com exigência"?',
    a: 'Significa que o processo está pausado aguardando uma ação sua — normalmente o envio de um documento ou uma correção. Verifique o histórico do protocolo para ver exatamente o que foi solicitado.',
  },
  {
    q: 'Como sei que houve uma atualização no meu protocolo?',
    a: 'A cada movimentação, a secretaria simula o envio de um e-mail de atualização para o endereço informado na abertura. Você também pode consultar o andamento a qualquer momento na tela "Consultar Protocolo".',
  },
  {
    q: 'Perdi o número do protocolo. E agora?',
    a: 'Entre em contato com a secretaria pela tela de Suporte, informando seu nome completo e CPF. A equipe poderá localizar o protocolo e reenviar o número.',
  },
]

export function FaqLista() {
  const [aberto, setAberto] = useState<number | null>(0)

  return (
    <div className="grid gap-3">
      {PERGUNTAS.map((item, i) => {
        const ativo = aberto === i
        return (
          <div
            key={item.q}
            className={cn(
              'overflow-hidden rounded-2xl border bg-card transition',
              ativo ? 'border-primary/40 shadow-sm' : 'border-border',
            )}
          >
            <h3>
              <button
                type="button"
                onClick={() => setAberto(ativo ? null : i)}
                aria-expanded={ativo}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="text-sm font-extrabold text-foreground sm:text-base">
                  {item.q}
                </span>
                <ChevronDown
                  className={cn(
                    'size-5 shrink-0 text-primary transition-transform',
                    ativo && 'rotate-180',
                  )}
                  aria-hidden="true"
                />
              </button>
            </h3>
            <div
              className={cn(
                'grid transition-all duration-200',
                ativo ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
              )}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
