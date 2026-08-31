# Changelog de dados institucionais reais

Atualização baseada em consulta ao site oficial do PPGFIL/UERJ em 30/08/2026.

## Fontes consultadas e dados confirmados

- [PPGFIL/UERJ – página inicial](https://ppgfil.uerj.br/): identidade institucional e navegação oficial.
- [Linhas de pesquisa](https://ppgfil.uerj.br/cópia-formulários): confirma as quatro linhas **Estética e Filosofia da Arte**, **Ética e Filosofia Política**, **Metafísica e Filosofia da Natureza** e **Teoria do Conhecimento e Filosofia das Ciências**.
- [Corpo docente](https://ppgfil.uerj.br/docentes): lista oficial com 35 docentes e páginas individuais “saiba mais”. As áreas de atuação foram resumidas a partir dessas páginas; o site não publica quantitativo de orientações e, por isso, esse campo permanece nulo. As páginas individuais não apresentam uma linha de pesquisa estruturada para todos os docentes; a vinculação foi deixada como `TODO`/nula onde não há confirmação explícita.
- As formações de maior nível (doutorado; ou mestrado quando não há doutorado publicado) e os links de [Currículo Lattes](http://lattes.cnpq.br/) foram conferidos nas biografias individuais. Instituições ausentes permanecem marcadas como `TODO`, sem inferência.
- [Formulários](https://ppgfil.uerj.br/formulários): catálogo oficial de 15 formulários. Os links Wix de download foram mantidos no cadastro; o item de estágio docente do doutorado não disponibiliza arquivo na fonte.
- [Manual do aluno](https://ppgfil.uerj.br/manual-do-aluno): confirmou janela de matrícula/cancelamento/alteração/inclusão (quatro primeiras semanas), regras de trancamento, créditos externos, estágio docente e prazo máximo de qualificação do doutorado.
- [Regimentos](https://ppgfil.uerj.br/regimentos): Deliberações 46/2024 e 09/2016 listadas como referências institucionais.
- [Disciplinas](https://ppgfil.uerj.br/disciplinas): nomes de disciplinas do quadro 2026.1 usados como vínculos de linha quando a associação é evidente pelo título.

## Pontos que permanecem TODO

- As páginas individuais de docentes não fornecem uma taxonomia completa e consistente de linha de pesquisa; não foi inventada uma vinculação ausente.
- Não foi encontrado prazo normativo explícito para todos os procedimentos. Nesses casos o sistema exibe “prazo não especificado no regimento”, em vez do prazo fictício anterior.
- O fluxo detalhado de marcação/realização de defesa depende de confirmação da secretaria e está sinalizado no código para revisão.
- Requisitos documentais por tipo de solicitação não foram inferidos sem fonte oficial; o checklist dinâmico continua disponível para configuração no admin.

## Contatos confirmados

- Telefone: (21) 2334-0678, ramal 25.
- E-mail: posfil@gmail.com; inscrições em disciplinas: inscricaoppgfil@gmail.com.
- Endereço: Rua São Francisco Xavier, 524, sala 9037, bloco F, Maracanã, Rio de Janeiro/RJ, CEP 20550-900.
- Atendimento: segunda a sexta, das 9h às 19h.
- Links institucionais: [IFCH](http://ifch.uerj.br), [PPGFIL](https://ppgfil.uerj.br/), [Ouvidoria-Geral](https://www.ouvidoria.uerj.br/) e [SIC](https://www.ouvidoria.uerj.br/sic-servico-de-informacao-ao-cidadao/).

## Arquivos e telas alterados

- `lib/conteudo-institucional.ts`: fontes, linhas, docentes, procedimentos, formulários e contatos reais.
- `data/categorias-solicitacoes.json`: categorias e tipos alinhados aos formulários oficiais, sem prazos numéricos inventados.
- `data/categorias-demo.json`: cópia dos dados genéricos anteriores para a restauração de demonstração.
- `lib/categorias.ts` e `lib/store.ts`: separação entre dados reais e restauração demo; prazos não confirmados agora são nulos/descritivos.
- `app/admin/corpo-docente`, `app/admin/categorias`, `app/admin/procedimentos`: exibição/edição dos dados reais e links para fontes.
- `app/solicitacao`, `app/consulta`, `app/admin/protocolos`: tratamento de prazos sem SLA confirmado.
- `components/public-shell.tsx` e `app/suporte/page.tsx`: contatos, IFCH, Filosofia, Ouvidoria e SIC.

A ação **Restaurar dados de exemplo** continua restaurando apenas o conjunto genérico em `data/categorias-demo.json`, preservando a separação entre ambiente de demonstração e dados institucionais reais.
