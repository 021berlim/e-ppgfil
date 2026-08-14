export const STATUS_LIST = [
  'Gerado',                     // Protocolo criado no sistema pelo usuário
  'Em tramitação',               // Servidor analisando o pedido e a documentação
  'Com exigência',              // Pausado: aguardando ação/documento do usuário
  'Deferido',        // Concluído com sucesso (pedido aprovado/executado)
  'Indeferido',      // Concluído com negativa (pedido negado)
] as const

export type Status = (typeof STATUS_LIST)[number]

export const CATEGORIAS = ['Discente', 'Docente', 'Candidato', 'Externo'] as const
export type Categoria = (typeof CATEGORIAS)[number]

export const TIPOS_SOLICITACAO = [
  'Matrícula',
  'Trancamento',
  'Aproveitamento de disciplina',
  'Solicitação de documento',
  'Outros',
] as const
export type TipoSolicitacao = (typeof TIPOS_SOLICITACAO)[number]

export type Anexo = {
  id: string
  nome: string
  tipo: string
  tamanho: number
}

// Prazo padrão (em dias úteis) por tipo de solicitação. Mockado, porém configurável.
export const PRAZO_SLA_DIAS: Record<TipoSolicitacao, number> = {
  'Matrícula': 3,
  'Trancamento': 5,
  'Aproveitamento de disciplina': 10,
  'Solicitação de documento': 5,
  'Outros': 7,
}

// Etapas finais: quando alcançadas, o protocolo é considerado concluído.
export const STATUS_FINAIS: Status[] = ['Deferido', 'Indeferido']

// Funcionários da secretaria disponíveis para atribuição (mock).
export const RESPONSAVEIS = [
  'Carla Nogueira',
  'Marcos Vinícius Prado',
  'Renata Bicalho',
  'Otávio Lins',
  'Sônia Meireles',
] as const
export type Responsavel = (typeof RESPONSAVEIS)[number]

// Modelos de resposta rápida para o histórico (mock, editáveis antes de salvar).
export const MODELOS_RESPOSTA = [
  'Documentação recebida, seguindo para análise.',
  'Aguardando retorno do solicitante para dar continuidade ao processo.',
  'Protocolo deferido. Favor verificar seu e-mail para as orientações finais.',
  'Necessário complementar a documentação enviada. Prazo de 10 dias para o envio.',
] as const

export type NotaInterna = {
  id: string
  data: string
  autor: string
  mensagem: string
}

export type EntradaHistorico = {
  id: string
  data: string
  autor: string
  origem: 'sistema' | 'secretaria' | 'solicitante'
  status: Status
  mensagem: string
  anexos: Anexo[]
}

export type Protocolo = {
  id: string
  numero: string
  cpf: string
  nome: string
  email: string
  categoria: Categoria
  tipo: TipoSolicitacao
  resumo: string
  status: Status
  subetapaExigencia?: 'respondida'
  arquivado?: boolean
  arquivadoEm?: string
  arquivadoPor?: string
  criadoEm: string
  atualizadoEm: string
  responsavel?: string
  notasInternas?: NotaInterna[]
  historico: EntradaHistorico[]
}

export const STATUS_STYLES: Record<
  Status,
  { chip: string; dot: string; column: string }
> = {
  Gerado: {
    chip: 'bg-[#6B1E2C]/10 text-[#6B1E2C] border-[#6B1E2C]/25',
    dot: 'bg-[#6B1E2C]',
    column: 'bg-[#6B1E2C]',
  },

  'Em tramitação': {
    chip: 'bg-[#C9A227]/15 text-[#7d6410] border-[#C9A227]/40',
    dot: 'bg-[#C9A227]',
    column: 'bg-[#C9A227]',
  },
  'Com exigência': {
    chip: 'bg-[#B56A1F]/15 text-[#8a4f13] border-[#B56A1F]/40',
    dot: 'bg-[#B56A1F]',
    column: 'bg-[#B56A1F]',
  },

  'Deferido': {
    chip: 'bg-[#3F7355]/15 text-[#2d5540] border-[#3F7355]/40',
    dot: 'bg-[#3F7355]',
    column: 'bg-[#3F7355]',
  },
  'Indeferido': {
    chip: 'bg-[#A33B3B]/15 text-[#732929] border-[#A33B3B]/40',
    dot: 'bg-[#A33B3B]',
    column: 'bg-[#A33B3B]',
  },

}
