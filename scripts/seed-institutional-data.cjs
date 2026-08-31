const fs = require('fs')
const vm = require('vm')
const ts = require('typescript')
const { Client } = require('pg')

function loadEnv() {
  const env = {}
  const raw = fs.readFileSync('.env', 'utf8')

  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/)
    if (!match) continue

    let value = match[2]
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    env[match[1]] = value
  }

  return env
}

function loadInstitutionalConstants() {
  const source = fs.readFileSync('lib/conteudo-institucional.ts', 'utf8')
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText

  const sandbox = {
    exports: {},
    module: { exports: {} },
    require,
  }
  sandbox.exports = sandbox.module.exports
  vm.runInNewContext(output, sandbox, { filename: 'conteudo-institucional.js' })
  return sandbox.module.exports
}

async function main() {
  const env = loadEnv()
  const constants = loadInstitutionalConstants()
  const client = new Client({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()
  try {
    await client.query('BEGIN')

    for (const line of constants.LINHAS_PESQUISA) {
      await client.query(
        `
          INSERT INTO public.research_lines (title, summary, disciplines, source_url)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (title) DO UPDATE
          SET summary = EXCLUDED.summary,
              disciplines = EXCLUDED.disciplines,
              source_url = EXCLUDED.source_url
        `,
        [line.titulo, line.resumo, line.disciplinas, constants.FONTES_OFICIAIS.linhas],
      )
    }

    for (const faculty of constants.CORPO_DOCENTE) {
      const degree = constants.FORMACAO_DOCENTE[faculty.nome]
      await client.query(
        `
          INSERT INTO public.faculty_members (
            full_name, position, expertise, highest_degree, lattes_url, profile_url,
            advising_count, is_active
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, true)
          ON CONFLICT (full_name) DO UPDATE
          SET position = EXCLUDED.position,
              expertise = EXCLUDED.expertise,
              highest_degree = EXCLUDED.highest_degree,
              lattes_url = EXCLUDED.lattes_url,
              profile_url = EXCLUDED.profile_url,
              advising_count = EXCLUDED.advising_count,
              is_active = true
        `,
        [
          faculty.nome,
          faculty.cargo,
          faculty.atuacao,
          degree?.posGraduacao ?? null,
          degree?.lattes ?? null,
          faculty.url,
          faculty.orientacoes,
        ],
      )
    }

    for (const form of constants.FORMULARIOS) {
      await client.query(
        `
          INSERT INTO public.institutional_forms (name, file_type, source_url, is_available)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (name) DO UPDATE
          SET file_type = EXCLUDED.file_type,
              source_url = EXCLUDED.source_url,
              is_available = EXCLUDED.is_available
        `,
        [form.nome, form.tipo, form.url, Boolean(form.url)],
      )
    }

    await client.query(
      `
        DELETE FROM public.institutional_forms
        WHERE name = ANY($1::text[])
      `,
      [
        [
          'Formulário de estágio docente - Mestrado',
          'Inscrição em disciplina - Mestrado',
          'Inscrição em disciplina - Doutorado',
          'Formulário de estágio docente - Doutorado',
        ],
      ],
    )

    for (const procedure of constants.PROCEDIMENTOS) {
      await client.query(
        `
          INSERT INTO public.procedures (title, deadline_text, steps, source_url)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (title) DO UPDATE
          SET deadline_text = EXCLUDED.deadline_text,
              steps = EXCLUDED.steps,
              source_url = EXCLUDED.source_url
        `,
        [procedure.titulo, procedure.prazo, procedure.passos, procedure.fonte],
      )
    }

    await client.query('COMMIT')

    const counts = await client.query(`
      SELECT
        (SELECT count(*) FROM public.research_lines)::int AS research_lines,
        (SELECT count(*) FROM public.faculty_members)::int AS faculty_members,
        (SELECT count(*) FROM public.institutional_forms)::int AS forms,
        (SELECT count(*) FROM public.procedures)::int AS procedures
    `)
    console.log(JSON.stringify(counts.rows[0], null, 2))
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(`Falha ao popular dados institucionais: ${error.message}`)
  process.exit(1)
})
