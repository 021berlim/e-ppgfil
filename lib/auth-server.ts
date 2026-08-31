import { cookies } from 'next/headers'
import { createHash, randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import {
  canManageAdministrativeCatalogs,
  canCreateUsers,
  canManageUsers,
  canWriteAdmin,
  type ClientSession,
  type DashboardRole,
} from '@/lib/auth-types'

export const SESSION_COOKIE = 'epfil_session'

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString('base64url')
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)

  await db.query(
    `
      INSERT INTO public.user_sessions (user_id, refresh_token_hash, expires_at)
      VALUES ($1, $2, $3)
    `,
    [userId, tokenHash, expiresAt],
  )

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (token) {
    await db.query(
      `
        UPDATE public.user_sessions
        SET revoked_at = now()
        WHERE refresh_token_hash = $1
          AND revoked_at IS NULL
      `,
      [hashToken(token)],
    )
  }
  cookieStore.delete(SESSION_COOKIE)
}

export async function getCurrentUser(): Promise<ClientSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const result = await db.query(
    `
      SELECT
        u.id,
        u.name,
        u.email,
        r.slug AS role
      FROM public.user_sessions s
      JOIN public.users u ON u.id = s.user_id
      JOIN public.user_roles ur ON ur.user_id = u.id
      JOIN public.roles r ON r.id = ur.role_id
      WHERE s.refresh_token_hash = $1
        AND s.revoked_at IS NULL
        AND s.expires_at > now()
        AND u.is_active = true
      LIMIT 1
    `,
    [hashToken(token)],
  )

  const user = result.rows[0]
  if (!user?.role) return null

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as DashboardRole,
    em: Date.now(),
  }
}

export async function authenticateDashboardUser(email: string, password: string) {
  const result = await db.query(
    `
      SELECT
        u.id,
        u.name,
        u.email,
        u.password_hash,
        r.slug AS role
      FROM public.users u
      JOIN public.user_roles ur ON ur.user_id = u.id
      JOIN public.roles r ON r.id = ur.role_id
      WHERE u.email = $1
        AND u.is_active = true
      LIMIT 1
    `,
    [email.toLowerCase()],
  )

  const user = result.rows[0]
  if (!user) {
    const count = await db.query('SELECT count(*)::int AS total FROM public.users')
    if (count.rows[0]?.total !== 0) return null

    const created = await bootstrapRootUser(email, password)
    await createSession(created.id)
    return {
      id: created.id,
      email: created.email,
      name: created.name,
      role: 'ROOT',
      em: Date.now(),
    } satisfies ClientSession
  }

  const passwordOk = await bcrypt.compare(password, user.password_hash)
  if (!passwordOk) return null

  await db.query('UPDATE public.users SET last_login_at = now() WHERE id = $1', [user.id])
  await createSession(user.id)

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as DashboardRole,
    em: Date.now(),
  } satisfies ClientSession
}

async function bootstrapRootUser(email: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 12)
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const userResult = await client.query(
      `
        INSERT INTO public.users (name, email, password_hash, is_active, last_login_at)
        VALUES ($1, $2, $3, true, now())
        RETURNING id, name, email
      `,
      [email.split('@')[0] || 'ROOT', email.toLowerCase(), passwordHash],
    )
    const roleResult = await client.query("SELECT id FROM public.roles WHERE slug = 'ROOT'")
    if (!roleResult.rows[0]) throw new Error('Cargo ROOT nao encontrado.')
    await client.query(
      `
        INSERT INTO public.user_roles (user_id, role_id)
        VALUES ($1, $2)
      `,
      [userResult.rows[0].id, roleResult.rows[0].id],
    )
    await client.query('COMMIT')
    return userResult.rows[0]
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function requireWriteAdmin() {
  const user = await getCurrentUser()
  if (!canWriteAdmin(user?.role)) {
    throw new Error('Acesso somente leitura para este cargo.')
  }
  return user
}

export async function requireManageUsers() {
  const user = await getCurrentUser()
  if (!canManageUsers(user?.role)) {
    throw new Error('Apenas ROOT ou SECRETARY_ADMIN podem gerenciar usuarios.')
  }
  return user
}

export async function requireManageAdministrativeCatalogs() {
  const user = await getCurrentUser()
  if (!canManageAdministrativeCatalogs(user?.role)) {
    throw new Error('Apenas ROOT ou SECRETARY_ADMIN podem gerenciar estes cadastros.')
  }
  return user
}

export async function requireCreateUsers() {
  const user = await getCurrentUser()
  if (!canCreateUsers(user?.role)) {
    throw new Error('Apenas ROOT pode cadastrar novos usuarios.')
  }
  return user
}
