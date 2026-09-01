const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

function loadEnv(filePath) {
  const env = {}
  const raw = fs.readFileSync(filePath, 'utf8')

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
  const migrationPath = process.argv[2]
  if (!migrationPath) {
    throw new Error('Informe o caminho da migracao SQL.')
  }

  let databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    if (fs.existsSync(path.resolve(process.cwd(), '.env.local'))) {
      databaseUrl = loadEnv(path.resolve(process.cwd(), '.env.local')).DATABASE_URL
    }
    if (!databaseUrl && fs.existsSync(path.resolve(process.cwd(), '.env'))) {
      databaseUrl = loadEnv(path.resolve(process.cwd(), '.env')).DATABASE_URL
    }
  }

  if (!databaseUrl) {
    throw new Error('DATABASE_URL ausente no ambiente, .env.local ou .env.')
  }

  const sql = fs.readFileSync(path.resolve(process.cwd(), migrationPath), 'utf8')
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()
  try {
    await client.query(sql)

    const verification = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (
          'users',
          'roles',
          'protocols',
          'protocol_history',
          'document_files',
          'audit_logs',
          'request_categories',
          'request_types'
        )
      ORDER BY table_name
    `)

    console.log(`Migracao aplicada. Tabelas verificadas: ${verification.rows
      .map((row) => row.table_name)
      .join(', ')}`)
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(`Falha ao aplicar migracao: ${error.message}`)
  process.exit(1)
})
