import { Pool } from 'pg'

declare global {
  // eslint-disable-next-line no-var
  var epfilPgPool: Pool | undefined
}

function createPool() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL nao configurada.')
  }

  return new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })
}

export const db = globalThis.epfilPgPool ?? createPool()

if (process.env.NODE_ENV !== 'production') {
  globalThis.epfilPgPool = db
}
