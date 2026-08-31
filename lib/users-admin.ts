import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

const ALLOWED_ROLES = ['ROOT', 'SECRETARY_ADMIN', 'SECRETARY_OPERATOR', 'COORDINATOR'] as const

export type DashboardRole = (typeof ALLOWED_ROLES)[number]

function requiredString(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Campo obrigatorio ausente: ${field}.`)
  }
  return value.trim()
}

function nullableString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function booleanValue(value: unknown, fallback = true) {
  return typeof value === 'boolean' ? value : fallback
}

function normalizeRole(value: unknown): DashboardRole {
  const role = requiredString(value, 'role') as DashboardRole
  if (!ALLOWED_ROLES.includes(role)) {
    throw new Error('Cargo invalido.')
  }
  return role
}

function validateEmail(value: unknown) {
  const email = requiredString(value, 'email').toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    throw new Error('E-mail invalido.')
  }
  return email
}

function validatePassword(value: unknown, required: boolean) {
  if (!required && (value === undefined || value === null || value === '')) return null
  const password = requiredString(value, 'password')
  if (password.length < 8) {
    throw new Error('A senha deve ter pelo menos 8 caracteres.')
  }
  return password
}

export async function listDashboardRoles() {
  const result = await db.query(
    `
      SELECT id, slug, name, description
      FROM public.roles
      WHERE slug = ANY($1::text[])
      ORDER BY array_position($1::text[], slug::text)
    `,
    [ALLOWED_ROLES],
  )
  return result.rows
}

export async function listDashboardUsers() {
  const result = await db.query(`
    SELECT
      u.id,
      u.name,
      u.email,
      u.is_active,
      u.last_login_at,
      u.created_at,
      u.updated_at,
      r.slug AS role,
      r.name AS role_name
    FROM public.users u
    LEFT JOIN public.user_roles ur ON ur.user_id = u.id
    LEFT JOIN public.roles r ON r.id = ur.role_id
    WHERE r.slug IS NULL OR r.slug IN ('ROOT', 'SECRETARY_ADMIN', 'SECRETARY_OPERATOR', 'COORDINATOR')
    ORDER BY u.name
  `)
  return result.rows
}

export async function createDashboardUser(payload: Record<string, unknown>) {
  const name = requiredString(payload.name, 'name')
  const email = validateEmail(payload.email)
  const password = validatePassword(payload.password, true)
  const role = normalizeRole(payload.role)
  const isActive = booleanValue(payload.is_active)
  const passwordHash = await bcrypt.hash(password!, 12)

  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const userResult = await client.query(
      `
        INSERT INTO public.users (name, email, password_hash, is_active)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, email, is_active, last_login_at, created_at, updated_at
      `,
      [name, email, passwordHash, isActive],
    )

    await assignSingleRole(client, userResult.rows[0].id, role)
    await client.query('COMMIT')
    return { ...userResult.rows[0], role, role_name: role }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function updateDashboardUser(id: string, payload: Record<string, unknown>) {
  const name = requiredString(payload.name, 'name')
  const email = validateEmail(payload.email)
  const password = validatePassword(payload.password, false)
  const role = normalizeRole(payload.role)
  const isActive = booleanValue(payload.is_active)

  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const userResult = password
      ? await client.query(
          `
            UPDATE public.users
            SET name = $2,
                email = $3,
                password_hash = $4,
                is_active = $5
            WHERE id = $1
            RETURNING id, name, email, is_active, last_login_at, created_at, updated_at
          `,
          [id, name, email, await bcrypt.hash(password, 12), isActive],
        )
      : await client.query(
          `
            UPDATE public.users
            SET name = $2,
                email = $3,
                is_active = $4
            WHERE id = $1
            RETURNING id, name, email, is_active, last_login_at, created_at, updated_at
          `,
          [id, name, email, isActive],
        )

    if (!userResult.rows[0]) {
      await client.query('ROLLBACK')
      return null
    }

    await assignSingleRole(client, id, role)
    await client.query('COMMIT')
    return { ...userResult.rows[0], role, role_name: role }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function deleteDashboardUser(id: string) {
  const result = await db.query('DELETE FROM public.users WHERE id = $1', [id])
  return result.rowCount ?? 0
}

async function assignSingleRole(client: Pick<typeof db, 'query'>, userId: string, role: DashboardRole) {
  const roleResult = await client.query('SELECT id FROM public.roles WHERE slug = $1', [role])
  const roleId = roleResult.rows[0]?.id
  if (!roleId) {
    throw new Error(`Cargo nao encontrado: ${role}.`)
  }

  await client.query('DELETE FROM public.user_roles WHERE user_id = $1', [userId])
  await client.query(
    `
      INSERT INTO public.user_roles (user_id, role_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `,
    [userId, roleId],
  )
}
