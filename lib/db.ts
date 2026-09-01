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
    max: process.env.PG_POOL_MAX ? parseInt(process.env.PG_POOL_MAX, 10) : 20,
    min: process.env.PG_POOL_MIN ? parseInt(process.env.PG_POOL_MIN, 10) : 2,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    maxUses: 7500,
    allowExitOnIdle: false,
  })
}

export const db = globalThis.epfilPgPool ?? createPool()

if (process.env.NODE_ENV !== 'production') {
  globalThis.epfilPgPool = db
}
