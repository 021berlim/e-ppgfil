const fs = require('fs')
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

async function main() {
  const env = loadEnv()
  const client = new Client({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()
  try {
    const tables = await client.query(`
      SELECT count(*)::int AS total
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
    `)

    const seeds = await client.query(`
      SELECT
        (SELECT count(*) FROM public.roles)::int AS roles,
        (SELECT count(*) FROM public.roles WHERE slug IN ('ROOT', 'SECRETARY_ADMIN', 'SECRETARY_OPERATOR', 'COORDINATOR'))::int AS dashboard_roles,
        (SELECT count(*) FROM public.request_categories)::int AS categories,
        (SELECT count(*) FROM public.request_types)::int AS request_types,
        (SELECT count(*) FROM public.research_lines)::int AS research_lines,
        (SELECT count(*) FROM public.institutional_forms)::int AS forms,
        (SELECT count(*) FROM public.procedures)::int AS procedures
    `)

    const rls = await client.query(`
      SELECT count(*)::int AS enabled
      FROM pg_tables
      WHERE schemaname = 'public'
        AND rowsecurity = true
    `)

    console.log(JSON.stringify({
      publicTables: tables.rows[0].total,
      rlsEnabledTables: rls.rows[0].enabled,
      seeds: seeds.rows[0],
    }, null, 2))
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(`Falha ao verificar schema: ${error.message}`)
  process.exit(1)
})
