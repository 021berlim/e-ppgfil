import { createClient } from '@redis/client'

function configuredClient() {
  return createClient({
    url: process.env.REDIS_URL,
    disableOfflineQueue: true,
    socket: {
      connectTimeout: 1_500,
      reconnectStrategy: false,
    },
  })
}

type RedisClient = ReturnType<typeof configuredClient>

declare global {
  // eslint-disable-next-line no-var
  var epfilRedisClient: RedisClient | undefined
}

const RETRY_DELAY_MS = 30_000
const WARNING_INTERVAL_MS = 60_000

let connectPromise: Promise<RedisClient | null> | null = null
let retryAfter = 0
const lastWarning = new Map<string, number>()

function warningKind(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  return /OOM|out of memory|maxmemory/i.test(message) ? 'oom' : 'unavailable'
}

function warn(operation: string, error: unknown) {
  const kind = warningKind(error)
  const warningKey = `${kind}:${operation}`
  const now = Date.now()
  if (now - (lastWarning.get(warningKey) ?? 0) < WARNING_INTERVAL_MS) return
  lastWarning.set(warningKey, now)

  const reason = error instanceof Error ? error.message : String(error)
  console.warn(
    `[Redis cache] ${kind === 'oom' ? 'Memoria cheia; gravacao ignorada' : 'Indisponivel; usando o banco diretamente'} (${operation}): ${reason}`,
  )
}

function newClient() {
  const client = configuredClient()
  client.on('error', (error) => warn('conexao', error))
  globalThis.epfilRedisClient = client
  return client
}

async function redisClient(): Promise<RedisClient | null> {
  if (!process.env.REDIS_URL) return null

  const existing = globalThis.epfilRedisClient
  if (existing?.isReady) return existing
  if (Date.now() < retryAfter) return null
  if (connectPromise) return connectPromise

  connectPromise = (async () => {
    let client = globalThis.epfilRedisClient
    try {
      if (client?.isOpen && !client.isReady) client.destroy()
      if (!client?.isOpen) client = newClient()
      await client.connect()
      retryAfter = 0
      return client
    } catch (error) {
      retryAfter = Date.now() + RETRY_DELAY_MS
      warn('conexao', error)
      if (client?.isOpen) client.destroy()
      return null
    } finally {
      connectPromise = null
    }
  })()

  return connectPromise
}

export async function redisRead<T>(
  operation: string,
  callback: (client: RedisClient) => Promise<T>,
): Promise<T | null> {
  const client = await redisClient()
  if (!client) return null

  try {
    return await callback(client)
  } catch (error) {
    warn(operation, error)
    return null
  }
}

export async function redisWrite(
  operation: string,
  callback: (client: RedisClient) => Promise<unknown>,
): Promise<boolean> {
  const client = await redisClient()
  if (!client) return false

  try {
    await callback(client)
    return true
  } catch (error) {
    // OOM and connection errors are intentionally swallowed: Redis is only an optimization.
    warn(operation, error)
    return false
  }
}
