import { deflateRawSync, inflateRawSync } from 'node:zlib'
import { RESP_TYPES } from '@redis/client'
import { DASHBOARD_ROLES, type ClientSession, type DashboardRole } from '@/lib/auth-types'
import { redisRead, redisWrite } from '@/lib/redis-client'

const CATALOG_KEY = 'd:c'
const ROLES_KEY = 'd:r'
const CATALOG_TTL_SECONDS = 300
const ROLES_TTL_SECONDS = 300
const SESSION_TTL_SECONDS = 30
const SESSION_INDEX_TTL_SECONDS = SESSION_TTL_SECONDS + 5
const MAX_COMPRESSED_BYTES = 64 * 1024
const MAX_SESSION_BYTES = 4 * 1024

export type CachedRole = {
  id: string
  slug: string
  name: string
  description: string | null
}

function compactTokenHash(tokenHash: string) {
  return Buffer.from(tokenHash, 'hex').toString('base64url')
}

function sessionKey(tokenHash: string) {
  return `s:${compactTokenHash(tokenHash)}`
}

function userSessionIndexKey(userId: string) {
  const hex = userId.replaceAll('-', '')
  const compactId = /^[0-9a-f]{32}$/i.test(hex)
    ? Buffer.from(hex, 'hex').toString('base64url')
    : userId
  return `u:${compactId}`
}

export async function readCatalogCache<T>(): Promise<T | null> {
  const compressed = await redisRead('ler catalogo', (client) =>
    client.withTypeMapping({ [RESP_TYPES.BLOB_STRING]: Buffer }).get(CATALOG_KEY),
  )
  if (!compressed) return null

  try {
    return JSON.parse(inflateRawSync(compressed).toString('utf8')) as T
  } catch (error) {
    console.warn('[Redis cache] Catalogo invalido; entrada descartada:', error)
    await invalidateCatalogCache()
    return null
  }
}

export async function writeCatalogCache(value: unknown) {
  const compressed = deflateRawSync(JSON.stringify(value), { level: 6 })
  if (compressed.byteLength > MAX_COMPRESSED_BYTES) {
    console.warn(
      `[Redis cache] Catalogo nao armazenado: ${compressed.byteLength} bytes comprimidos excedem o limite de ${MAX_COMPRESSED_BYTES}.`,
    )
    return false
  }

  return redisWrite('gravar catalogo', (client) =>
    client.set(CATALOG_KEY, compressed, { EX: CATALOG_TTL_SECONDS }),
  )
}

export async function invalidateCatalogCache() {
  return redisWrite('invalidar catalogo', (client) => client.del(CATALOG_KEY))
}

export async function readRolesCache(): Promise<CachedRole[] | null> {
  const values = await redisRead('ler cargos', (client) => client.hGetAll(ROLES_KEY))
  if (!values || !values.n) return null

  const count = Number(values.n)
  if (!Number.isInteger(count) || count < 1 || count > DASHBOARD_ROLES.length) return null

  const roles: CachedRole[] = []
  for (let index = 0; index < count; index += 1) {
    const id = values[`${index}i`]
    const slug = values[`${index}s`]
    const name = values[`${index}n`]
    if (!id || !slug || !name) return null
    roles.push({ id, slug, name, description: values[`${index}d`] || null })
  }
  return roles
}

export async function writeRolesCache(roles: CachedRole[]) {
  const fields: Record<string, string> = { n: String(roles.length) }
  roles.forEach((role, index) => {
    fields[`${index}i`] = role.id
    fields[`${index}s`] = role.slug
    fields[`${index}n`] = role.name
    if (role.description) fields[`${index}d`] = role.description
  })

  return redisWrite('gravar cargos', async (client) => {
    await client.multi().hSet(ROLES_KEY, fields).expire(ROLES_KEY, ROLES_TTL_SECONDS).exec()
  })
}

export async function readSessionCache(tokenHash: string): Promise<ClientSession | null> {
  const values = await redisRead('ler sessao', (client) => client.hGetAll(sessionKey(tokenHash)))
  if (!values?.i || !values.e || !values.r) return null
  if (!DASHBOARD_ROLES.includes(values.r as DashboardRole)) return null

  return {
    id: values.i,
    email: values.e,
    name: values.n || undefined,
    avatar_url: values.a || null,
    role: values.r as DashboardRole,
    em: Date.now(),
  }
}

export async function writeSessionCache(tokenHash: string, user: ClientSession) {
  if (!user.id) return false

  const fields: Record<string, string> = {
    i: user.id,
    e: user.email,
    r: user.role,
  }
  if (user.name) fields.n = user.name
  if (user.avatar_url) fields.a = user.avatar_url

  const payloadBytes = Object.entries(fields).reduce(
    (total, [field, value]) => total + Buffer.byteLength(field) + Buffer.byteLength(value),
    0,
  )
  // Data-URI avatars can exceed 1 MB. Do not cache an incomplete session or that payload.
  if (payloadBytes > MAX_SESSION_BYTES) return false

  const key = sessionKey(tokenHash)
  const indexKey = userSessionIndexKey(user.id)
  return redisWrite('gravar sessao', async (client) => {
    await client
      .multi()
      .hSet(key, fields)
      .expire(key, SESSION_TTL_SECONDS)
      .sAdd(indexKey, key)
      .expire(indexKey, SESSION_INDEX_TTL_SECONDS)
      .exec()
  })
}

export async function invalidateSessionCache(tokenHash: string) {
  return redisWrite('invalidar sessao', (client) => client.del(sessionKey(tokenHash)))
}

export async function invalidateUserSessionCache(userId: string) {
  const indexKey = userSessionIndexKey(userId)
  return redisWrite('invalidar sessoes do usuario', async (client) => {
    const keys = await client.sMembers(indexKey)
    await client.del(keys.length ? [...keys, indexKey] : indexKey)
  })
}
