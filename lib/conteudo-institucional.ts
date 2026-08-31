export const FONTES_OFICIAIS = {
  linhas: 'https://ppgfil.uerj.br/cópia-formulários',
  docentes: 'https://ppgfil.uerj.br/docentes',
  formularios: 'https://ppgfil.uerj.br/formulários',
  manual: 'https://ppgfil.uerj.br/manual-do-aluno',
  regimentos: 'https://ppgfil.uerj.br/regimentos',
  disciplinas: 'https://ppgfil.uerj.br/disciplinas',
} as const

export const CONTATO_PPGFIL = {
  telefone: '(21) 2334-0678, ramal 25',
  email: 'posfil@gmail.com',
  emailInscricoes: 'inscricaoppgfil@gmail.com',
  endereco: 'Rua São Francisco Xavier, 524, Sala 9037, Bloco F, Maracanã, Rio de Janeiro/RJ, CEP 20550-900',
  atendimento: 'Segunda a sexta, das 9h às 19h',
  ifch: 'http://ifch.uerj.br',
  ppgfil: 'https://ppgfil.uerj.br/',
  ouvidoria: 'https://www.ouvidoria.uerj.br/',
  sic: 'https://www.ouvidoria.uerj.br/sic-servico-de-informacao-ao-cidadao/',
} as const

export const LINHAS_PESQUISA = [
  { titulo: 'Estética e Filosofia da Arte', resumo: 'TODO: o site oficial confirma o nome da linha, mas não publica uma descrição específica. Validar a ementa institucional com a coordenação.', disciplinas: ['Tópicos de Estética', 'Estética I', 'Estética II', 'Questões de Estética'] },
  { titulo: 'Ética e Filosofia Política', resumo: 'TODO: o site oficial confirma o nome da linha, mas não publica uma descrição específica. Validar a ementa institucional com a coordenação.', disciplinas: ['Tópicos de Ética', 'Filosofia Política I'] },
  { titulo: 'Metafísica e Filosofia da Natureza', resumo: 'TODO: o site oficial confirma o nome da linha, mas não publica uma descrição específica. Validar a ementa institucional com a coordenação.', disciplinas: ['Metafísica I', 'Tópicos de Filosofia da Natureza', 'Filosofia da Natureza II', 'Tópicos Especiais de Metafísica'] },
  { titulo: 'Teoria do Conhecimento e Filosofia das Ciências', resumo: 'TODO: o site oficial confirma o nome da linha, mas não publica uma descrição específica. Validar a ementa institucional com a coordenação.', disciplinas: ['Questões de Teoria do Conhecimento'] },
] as const

type Docente = {
  nome: string
  cargo: 'Professor' | 'Professora' | 'Coordenador' | 'Vice-coordenadora'
  linha: string | null
  atuacao: string | null
  orientacoes: number | null
  url: string
  formacao?: string | null
  lattes?: string | null
}

// A página oficial não informa explicitamente a linha de vinculação dos docentes.
// Os campos `linha` permanecem nulos até confirmação pela coordenação.
export const CORPO_DOCENTE: Docente[] = [
  { nome: 'Alexandre Marques Cabral', cargo: 'Professor', linha: null, atuacao: 'Metafísica, filosofia da religião e pensamento brasileiro', orientacoes: null, url: 'https://ppgfil.uerj.br/about-8' },
  { nome: 'Daniel de Vasconcelos Costa', cargo: 'Professor', linha: null, atuacao: 'Ética, filosofia política, filosofia do direito, filosofia social, bioética, neuroética e filosofia da ação', orientacoes: null, url: 'https://ppgfil.uerj.br/danieldevasconceloscosta' },
  { nome: 'Fabiano de Lemos Britto', cargo: 'Professor', linha: null, atuacao: 'Estética e política moderna e contemporânea, Romantismo, teologia política e crítica do cânone', orientacoes: null, url: 'https://ppgfil.uerj.br/fabianodelemosbritto' },
  { nome: 'Izabela Aquino Bocayuva', cargo: 'Professora', linha: null, atuacao: 'Filosofia antiga, pré-socráticos, Platão e filosofia política em perspectiva anticolonial', orientacoes: null, url: 'https://ppgfil.uerj.br/izabelaaquinobocayuva' },
  { nome: 'Marcelo de Araujo', cargo: 'Professor', linha: null, atuacao: 'Ética, filosofia do direito, bioética e filosofia política', orientacoes: null, url: 'https://ppgfil.uerj.br/marcelodearaujo' },
  { nome: 'Marcos André Gleizer', cargo: 'Professor', linha: null, atuacao: 'Filosofia moderna, conhecimento, metafísica, ética, Espinosa e Descartes', orientacoes: null, url: 'https://ppgfil.uerj.br/marcosandregleizer' },
  { nome: 'Paulo Cesar Gil Ferreira Junior', cargo: 'Professor', linha: null, atuacao: 'Ontologia, ética e valor, fenomenologia, hermenêutica, linguagem, religião e crítica da modernidade', orientacoes: null, url: 'https://ppgfil.uerj.br/paulocesargilferreirajunior' },
  { nome: 'Ricardo José Correa Barbosa', cargo: 'Professor', linha: null, atuacao: 'Filosofia da música e Theodor W. Adorno', orientacoes: null, url: 'https://ppgfil.uerj.br/cópia-regina-helena-sarpa-schopke' },
  { nome: 'Tito Marques Palmeiro', cargo: 'Professor', linha: null, atuacao: 'Filosofia contemporânea, fenomenologia, técnica e arte', orientacoes: null, url: 'https://ppgfil.uerj.br/cópia-tiago-de-castro-alves' },
  { nome: 'Antonio Augusto Passos Videira', cargo: 'Professor', linha: null, atuacao: 'Filosofia da natureza, filosofia da ciência e história da física e da astronomia', orientacoes: null, url: 'https://ppgfil.uerj.br/antonio-augusto-passos-videira' },
  { nome: 'Danillo de Jesus Ferreira Leite', cargo: 'Professor', linha: null, atuacao: 'Kant, teoria do conhecimento, epistemologia e história da filosofia moderna', orientacoes: null, url: 'https://ppgfil.uerj.br/danillodejesusferreiraleite' },
  { nome: 'Felipe Ramos Gall', cargo: 'Professor', linha: null, atuacao: 'Filosofia antiga, estudos clássicos, comédia e recepção da Antiguidade no Renascimento', orientacoes: null, url: 'https://ppgfil.uerj.br/feliperamosgall' },
  { nome: 'Luiz Bernardo Leite Araujo', cargo: 'Professor', linha: null, atuacao: 'Ética e filosofia política', orientacoes: null, url: 'https://ppgfil.uerj.br/luizbernardoleitearaujo' },
  { nome: 'Márcia Cristina Ferreira Gonçalves', cargo: 'Professora', linha: null, atuacao: 'Idealismo alemão, filosofia da natureza e filosofia da arte, especialmente Hegel e Schelling', orientacoes: null, url: 'https://ppgfil.uerj.br/marciacristinafgonçalves' },
  { nome: 'Marcos Henrique da Silva Rosa', cargo: 'Professor', linha: null, atuacao: 'Metafísica, filosofia da mente, filosofia analítica, Kant, percepção e autoconsciência', orientacoes: null, url: 'https://ppgfil.uerj.br/marcoshenriquedasilvarosa' },
  { nome: 'Pedro Thyago dos Santos Ferreira', cargo: 'Professor', linha: null, atuacao: 'Filosofia medieval, metafísica, filosofia da ação e filosofia da religião', orientacoes: null, url: 'https://ppgfil.uerj.br/pedrothyagodossantos' },
  { nome: 'Rodrigo Gueron', cargo: 'Professor', linha: null, atuacao: 'Estética, filosofia da arte, cinema, política, Deleuze e Guattari', orientacoes: null, url: 'https://ppgfil.uerj.br/rodrigogueron' },
  { nome: 'Ulysses Pinheiro', cargo: 'Professor', linha: null, atuacao: 'História da filosofia moderna, política e estética', orientacoes: null, url: 'https://ppgfil.uerj.br/ulyssespinheiro' },
  { nome: 'Camila Rodrigues Jourdan', cargo: 'Professora', linha: null, atuacao: 'Filosofia política libertária, filosofia da linguagem, Wittgenstein, Foucault e materialismo linguístico', orientacoes: null, url: 'https://ppgfil.uerj.br/camilarodriguesjourdan' },
  { nome: 'Dirce Eleonora Nigro Solis', cargo: 'Professora', linha: null, atuacao: 'Ética e filosofia política, estética, epistemologia, desconstrução e filosofia francesa contemporânea', orientacoes: null, url: 'https://ppgfil.uerj.br/dirceeleonoranigrosolis' },
  { nome: 'Fernando Maia Freire Ribeiro', cargo: 'Professor', linha: null, atuacao: null, orientacoes: null, url: 'https://ppgfil.uerj.br/fernandomaiafreireribeiro' },
  { nome: 'Luiz Carlos Pinheiro Dias Pereira', cargo: 'Professor', linha: null, atuacao: 'Lógica, Wittgenstein, dedução natural, teoria da prova e construtivismo', orientacoes: null, url: 'https://ppgfil.uerj.br/luizcarlospdiaspereira' },
  { nome: 'Marcio Francisco T. Oliveira', cargo: 'Professor', linha: null, atuacao: 'Filosofia da educação, teoria do conhecimento, ética, metafísica e Espinosa', orientacoes: null, url: 'https://ppgfil.uerj.br/marciofranciscotoliveira' },
  { nome: 'Maria Helena Lisboa da Cunha', cargo: 'Professora', linha: null, atuacao: 'Estética filosófica, metafísica e história da filosofia antiga e contemporânea', orientacoes: null, url: 'https://ppgfil.uerj.br/mariahelenalisboadacunha' },
  { nome: 'Rafael Haddock Lobo', cargo: 'Professor', linha: null, atuacao: 'Desconstrução, alteridade, filosofia popular brasileira, Derrida e Lévinas', orientacoes: null, url: 'https://ppgfil.uerj.br/cópia-paulo-cesar-gil-ferreira-junior' },
  { nome: 'Rosa Maria Dias', cargo: 'Professora', linha: null, atuacao: 'Estética, cultura, educação, filosofia e cinema', orientacoes: null, url: 'https://ppgfil.uerj.br/cópia-rogério-soares-da-costa' },
  { nome: 'Vera Maria Portocarrero', cargo: 'Professora', linha: null, atuacao: 'Filosofia e história das ciências, epistemologia, Foucault, Canguilhem, ética e filosofia política', orientacoes: null, url: 'https://ppgfil.uerj.br/veramariaportocarrero' },
  { nome: 'Carlos Cardozo Coelho', cargo: 'Professor', linha: null, atuacao: 'Ontologia contemporânea, decolonialismo, epistemologia feminista, desconstrução e psicanálise', orientacoes: null, url: 'https://ppgfil.uerj.br/carloscardozocoelho' },
  { nome: 'Edgar da Rocha Marques', cargo: 'Coordenador', linha: null, atuacao: 'Filosofia da linguagem, metafísica, Leibniz, Wittgenstein e filosofia moderna', orientacoes: null, url: 'https://ppgfil.uerj.br/edgardarochamarques' },
  { nome: 'Ivair Coelho Lisboa Rademaker de Nogueira Itagiba Filho', cargo: 'Professor', linha: null, atuacao: 'História da filosofia, devir, criação, natureza, potência e poder', orientacoes: null, url: 'https://ppgfil.uerj.br/ivaircoelholisboarnif' },
  { nome: 'Marcela Figueiredo Cibella de Oliveira', cargo: 'Vice-coordenadora', linha: null, atuacao: 'Estética e filosofia da arte, filosofia contemporânea, teoria do teatro e literatura', orientacoes: null, url: 'https://ppgfil.uerj.br/marcelaoliveira' },
  { nome: 'Marco Antonio dos Santos Casa Nova', cargo: 'Professor', linha: null, atuacao: 'Nietzsche, Heidegger, fenomenologia, hermenêutica, historicidade e filosofia contemporânea', orientacoes: null, url: 'https://ppgfil.uerj.br/marcoantoniocasanova' },
  { nome: 'Naiara Paula Eugenio', cargo: 'Professora', linha: null, atuacao: 'Estética e filosofia da arte africana e afro-brasileira', orientacoes: null, url: 'https://ppgfil.uerj.br/naiarapaulaeugenio' },
  { nome: 'Regina Helena Sarpa Schopke', cargo: 'Professora', linha: null, atuacao: 'Filosofia da diferença, Deleuze, tempo, movimento, resistência e ética animal', orientacoes: null, url: 'https://ppgfil.uerj.br/reginahelenasarpaschopke' },
  { nome: 'Tiago de Castro Alves', cargo: 'Professor', linha: null, atuacao: 'Lógica, identidade de provas, sinonímia, normalização e hipóteses', orientacoes: null, url: 'https://ppgfil.uerj.br/tiagodecastroalves' },
]

/** Formação de maior nível identificada nas biografias oficiais; TODO indica ausência de confirmação pública. */
export const FORMACAO_DOCENTE: Record<string, { posGraduacao: string | null; lattes: string | null }> = {
  'Alexandre Marques Cabral': { posGraduacao: 'Doutorado em Filosofia — Universidade do Estado do Rio de Janeiro (UERJ)', lattes: 'http://lattes.cnpq.br/1769889347003096' },
  'Daniel de Vasconcelos Costa': { posGraduacao: 'Doutorado em Filosofia — Goethe-Universität Frankfurt am Main', lattes: 'http://lattes.cnpq.br/3525714695869938' },
  'Fabiano de Lemos Britto': { posGraduacao: 'Doutorado em Filosofia — Universidade do Estado do Rio de Janeiro (UERJ)', lattes: 'http://lattes.cnpq.br/6441173133501487' },
  'Izabela Aquino Bocayuva': { posGraduacao: 'Doutorado em Filosofia — Universidade Federal do Rio de Janeiro (UFRJ)', lattes: 'http://lattes.cnpq.br/1912942814740549' },
  'Marcelo de Araujo': { posGraduacao: null, lattes: 'http://lattes.cnpq.br/2379951820482310' },
  'Marcos André Gleizer': { posGraduacao: 'Doutorado em Filosofia — Université de Paris IV (Sorbonne)', lattes: 'http://lattes.cnpq.br/6183354843509348' },
  'Paulo Cesar Gil Ferreira Junior': { posGraduacao: 'Doutorado em Filosofia — Universidade do Estado do Rio de Janeiro (UERJ)', lattes: 'http://lattes.cnpq.br/6402410885346401' },
  'Ricardo José Correa Barbosa': { posGraduacao: 'Doutorado em Filosofia — Pontifícia Universidade Católica do Rio de Janeiro (PUC-Rio)', lattes: 'http://lattes.cnpq.br/0546360463436776' },
  'Tito Marques Palmeiro': { posGraduacao: null, lattes: 'http://lattes.cnpq.br/0278164595656451' },
  'Antonio Augusto Passos Videira': { posGraduacao: 'Doutorado em Filosofia — Université Paris VII (Denis Diderot)', lattes: 'http://lattes.cnpq.br/1855174964691600' },
  'Danillo de Jesus Ferreira Leite': { posGraduacao: 'Doutorado em Filosofia — UFRJ (Programa de Pós-Graduação em Lógica e Metafísica)', lattes: 'http://lattes.cnpq.br/1723036844993070' },
  'Felipe Ramos Gall': { posGraduacao: 'Doutorado em Filosofia — Pontifícia Universidade Católica do Rio de Janeiro (PUC-Rio)', lattes: 'http://lattes.cnpq.br/2338217895232988' },
  'Luiz Bernardo Leite Araujo': { posGraduacao: 'Doutorado em Filosofia — Université Catholique de Louvain', lattes: 'http://lattes.cnpq.br/7734537285998313' },
  'Márcia Cristina Ferreira Gonçalves': { posGraduacao: 'Doutorado em Filosofia — Freie Universität Berlin', lattes: 'http://lattes.cnpq.br/3242552423805410' },
  'Marcos Henrique da Silva Rosa': { posGraduacao: 'Doutorado em Filosofia — Universidade do Estado do Rio de Janeiro (UERJ)', lattes: 'http://lattes.cnpq.br/3856420415182009' },
  'Pedro Thyago dos Santos Ferreira': { posGraduacao: 'Doutorado em Filosofia — UFRJ (Programa de Pós-Graduação em Lógica e Metafísica)', lattes: null },
  'Rodrigo Gueron': { posGraduacao: 'Doutorado em Filosofia — TODO: instituição não informada na biografia oficial consultada', lattes: 'http://lattes.cnpq.br/7403941651097693' },
  'Ulysses Pinheiro': { posGraduacao: 'Doutorado em Filosofia — Universidade Federal do Rio de Janeiro (UFRJ)', lattes: 'http://lattes.cnpq.br/8793951581697655' },
  'Camila Rodrigues Jourdan': { posGraduacao: 'Doutorado em Filosofia — Pontifícia Universidade Católica do Rio de Janeiro (PUC-Rio)', lattes: 'http://lattes.cnpq.br/3659855873286126' },
  'Dirce Eleonora Nigro Solis': { posGraduacao: 'Doutorado em Filosofia — Universidade do Estado do Rio de Janeiro (UERJ)', lattes: 'http://lattes.cnpq.br/7985596381827103' },
  'Fernando Maia Freire Ribeiro': { posGraduacao: 'Doutorado em Filosofia — Universidade do Estado do Rio de Janeiro (UERJ)', lattes: 'http://lattes.cnpq.br/3037164682984821' },
  'Luiz Carlos Pinheiro Dias Pereira': { posGraduacao: 'Doutorado em Filosofia — Universidade de Estocolmo', lattes: 'http://lattes.cnpq.br/8418729116626386' },
  'Marcio Francisco T. Oliveira': { posGraduacao: 'Doutorado em Filosofia — Universidade do Estado do Rio de Janeiro (UERJ)', lattes: null },
  'Maria Helena Lisboa da Cunha': { posGraduacao: null, lattes: 'http://lattes.cnpq.br/6791769143433034' },
  'Rafael Haddock Lobo': { posGraduacao: null, lattes: 'http://lattes.cnpq.br/5393663349640485' },
  'Rosa Maria Dias': { posGraduacao: 'Doutorado em Filosofia — Universidade Federal do Rio de Janeiro (UFRJ)', lattes: 'http://lattes.cnpq.br/1602571505425562' },
  'Vera Maria Portocarrero': { posGraduacao: 'Mestrado em Filosofia — Pontifícia Universidade Católica do Rio de Janeiro (PUC-Rio); doutorado: TODO', lattes: 'http://lattes.cnpq.br/9436574047648562' },
  'Carlos Cardozo Coelho': { posGraduacao: null, lattes: 'http://lattes.cnpq.br/6091310866668714' },
  'Edgar da Rocha Marques': { posGraduacao: 'Doutorado em Filosofia — Universität Konstanz', lattes: 'http://lattes.cnpq.br/6575628569660162' },
  'Ivair Coelho Lisboa Rademaker de Nogueira Itagiba Filho': { posGraduacao: 'Doutorado em Filosofia — Universidade Federal do Rio de Janeiro (UFRJ)', lattes: 'http://lattes.cnpq.br/3991940646843712' },
  'Marcela Figueiredo Cibella de Oliveira': { posGraduacao: 'Doutorado em Filosofia — Pontifícia Universidade Católica do Rio de Janeiro (PUC-Rio)', lattes: 'http://lattes.cnpq.br/1587027724745056' },
  'Marco Antonio dos Santos Casa Nova': { posGraduacao: null, lattes: 'http://lattes.cnpq.br/3409704326617178' },
  'Naiara Paula Eugenio': { posGraduacao: 'Doutorado em Filosofia — Universidade do Estado do Rio de Janeiro (UERJ)', lattes: null },
  'Regina Helena Sarpa Schopke': { posGraduacao: 'Doutorado em Filosofia — Universidade Estadual de Campinas (UNICAMP)', lattes: 'http://lattes.cnpq.br/7437184868462725' },
  'Tiago de Castro Alves': { posGraduacao: 'Doutorado em Filosofia — Universität Tübingen', lattes: 'http://lattes.cnpq.br/1862264938795608' },
}

export const PROCEDIMENTOS = [
  { titulo: 'Matrícula e inscrição em disciplinas', prazo: 'Conforme o calendário acadêmico de cada período', passos: ['Consultar previamente o quadro de horários e as ementas publicados pelo PPGFIL.', 'Preencher o formulário de inscrição disponibilizado no site e enviado pela secretaria.', 'Enviar o formulário pelo canal específico de inscrições dentro do período divulgado.', 'Manter inscrição em disciplinas em todos os períodos letivos enquanto houver vínculo com o Programa.'], fonte: FONTES_OFICIAIS.manual },
  { titulo: 'Alteração de inscrição em disciplina', prazo: 'Durante as quatro primeiras semanas de aula', passos: ['Preencher o formulário oficial de alteração de inscrição em disciplina.', 'Indicar claramente cancelamento, troca ou inclusão pretendida.', 'Enviar a solicitação pelo canal de inscrições dentro das quatro primeiras semanas.', 'Aguardar a validação da secretaria; abandono após esse limite implica reprovação.'], fonte: FONTES_OFICIAIS.manual },
  { titulo: 'Aproveitamento de créditos', prazo: 'Prazo de solicitação não especificado no regimento/manual', passos: ['Reunir histórico e ementa da disciplina cursada em programa reconhecido.', 'Confirmar que a disciplina possui quatro créditos e foi cursada nos três anos anteriores à matrícula.', 'Preencher o formulário oficial de aproveitamento de créditos.', 'Submeter o pedido à análise da Comissão de Pós-Graduação, que pode validar até duas disciplinas.'], fonte: FONTES_OFICIAIS.manual },
  { titulo: 'Trancamento de matrícula', prazo: 'Até 6 meses no Mestrado e 12 meses no Doutorado', passos: ['Confirmar o cumprimento de ao menos um semestre com todas as exigências do curso.', 'Obter a anuência do orientador e apresentar motivos relevantes.', 'Encaminhar a solicitação à Comissão de Pós-Graduação em Filosofia.', 'Aguardar a deliberação; o período deferido não conta para a integralização do curso.'], fonte: FONTES_OFICIAIS.manual },
  { titulo: 'Marcação de defesa', prazo: 'Prazo administrativo não especificado no regimento/manual', passos: [
    // TODO: não confirmado em fonte oficial — revisar este fluxo operacional com a secretaria.
    'Confirmar com a secretaria o atendimento aos créditos e demais requisitos do curso.', 'Solicitar ao orientador a indicação da banca examinadora.', 'Encaminhar o requerimento de homologação de banca e a versão do trabalho.', 'Aguardar confirmação da homologação e as orientações para realização da defesa.'], fonte: FONTES_OFICIAIS.regimentos },
]

export const FORMULARIOS = [
  { nome: 'Formulário de Solicitação de Auxílio', tipo: 'PDF', url: 'https://ppgfil.uerj.br/_files/ugd/50de38_7efe70be390b485db701caa5a715cfa9.pdf' },
  { nome: 'Formulário de Requerimento de homologação de banca', tipo: 'PDF', url: 'https://ppgfil.uerj.br/_files/ugd/50de38_365539fadc80439cbc4e77679c3349a9.pdf' },
  { nome: 'Formulário de Requerimento de diploma', tipo: 'PDF', url: 'https://ppgfil.uerj.br/_files/ugd/50de38_278f6792584e464685882e0ebd3102aa.pdf' },
  { nome: 'Formulário de Alteração de Disciplinas', tipo: 'PDF', url: 'https://ppgfil.uerj.br/_files/ugd/50de38_0a559a61fa724dbc9c98cc81447dfa67.pdf' },
  { nome: 'Formulário de Pedido de prorrogação', tipo: 'PDF', url: 'https://ppgfil.uerj.br/_files/ugd/50de38_bd2b04526bb745af8c236622525322af.pdf' },
  { nome: 'Formulário de Aproveitamento de créditos', tipo: 'PDF', url: 'https://ppgfil.uerj.br/_files/ugd/50de38_56c02fdeabb647c695e69736ecd16051.pdf' },
  { nome: 'Formulário de estágio docente — Mestrado', tipo: 'PDF', url: 'https://ppgfil.uerj.br/_files/ugd/756bb3_0f8f5233c74447bb83835b2ddaffa7dd.pdf' },
  { nome: 'Formulário de estágio docente — Doutorado', tipo: 'PDF', url: null },
  { nome: 'Requerimento de prorrogação de prazo de conclusão do curso', tipo: 'PDF', url: 'https://ppgfil.uerj.br/_files/ugd/756bb3_e9a9d6af012e42b88d2eda0132489de9.pdf' },
  { nome: 'Inscrição em disciplina — Mestrado', tipo: 'PDF', url: 'https://ppgfil.uerj.br/_files/ugd/756bb3_e50728f7ba3b4c08a0f3beebcf70a7d7.pdf' },
  { nome: 'Inscrição em disciplina — Doutorado', tipo: 'PDF', url: 'https://ppgfil.uerj.br/_files/ugd/756bb3_e50728f7ba3b4c08a0f3beebcf70a7d7.pdf' },
  { nome: 'Inscrição de aluno externo', tipo: 'PDF', url: 'https://ppgfil.uerj.br/_files/ugd/756bb3_a2875d86bce2476ea1a34f20ee983e0e.pdf' },
  { nome: 'Inscrição em disciplina isolada', tipo: 'PDF', url: 'https://ppgfil.uerj.br/_files/ugd/756bb3_eda83bb38c6d466c86f12e0758bff595.pdf' },
  { nome: 'Alteração de inscrição em disciplina', tipo: 'PDF', url: 'https://ppgfil.uerj.br/_files/ugd/756bb3_8ade9dc59c7e48df880348ac60e993bb.pdf' },
  { nome: 'Formulário de Matrícula', tipo: 'DOC', url: 'https://ppgfil.uerj.br/_files/ugd/50de38_9e29addcf4cf4110b1170588bae5902c.doc?dn=Formul%C3%A1rio%20de%20Matr%C3%ADcula%20atualizado.doc' },
] as const
