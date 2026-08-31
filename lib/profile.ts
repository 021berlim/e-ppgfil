import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import type { ClientSession, DashboardRole } from '@/lib/auth-types'

function requiredString(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Campo obrigatorio ausente: ${field}.`)
  }
  return value.trim()
}

function optionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function validateEmail(value: unknown) {
  const email = requiredString(value, 'email').toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    throw new Error('E-mail invalido.')
  }
  return email
}

function validateAvatarUrl(value: unknown) {
  const avatarUrl = optionalString(value)
  if (!avatarUrl) return null
  const isImageData = /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(avatarUrl)
  const isRemoteImage = /^https?:\/\/.+/i.test(avatarUrl)
  if (!isImageData && !isRemoteImage) {
    throw new Error('Foto de perfil invalida.')
  }
  if (avatarUrl.length > 1_400_000) {
    throw new Error('A foto deve ter no maximo 1 MB.')
  }
  return avatarUrl
}

function validateNewPassword(value: unknown) {
  if (value === undefined || value === null || value === '') return null
  const password = requiredString(value, 'newPassword')
  if (password.length < 8) {
    throw new Error('A nova senha deve ter pelo menos 8 caracteres.')
  }
  return password
}

export async function updateOwnProfile(user: ClientSession, payload: Record<string, unknown>) {
  if (!user.id) {
    throw new Error('Sessao invalida.')
  }

  const email = validateEmail(payload.email)
  const avatarUrl = validateAvatarUrl(payload.avatar_url)
  const newPassword = validateNewPassword(payload.newPassword)
  const currentPassword = optionalString(payload.currentPassword)

  const currentResult = await db.query(
    `
      SELECT
        u.id,
        u.name,
        u.password_hash,
        r.slug AS role
      FROM public.users u
      JOIN public.user_roles ur ON ur.user_id = u.id
      JOIN public.roles r ON r.id = ur.role_id
      WHERE u.id = $1
        AND u.is_active = true
      LIMIT 1
    `,
    [user.id],
  )

  const current = currentResult.rows[0]
  if (!current) {
    throw new Error('Usuario nao encontrado.')
  }

  if (newPassword) {
    if (!currentPassword) {
      throw new Error('Informe a senha atual para alterar a senha.')
    }
    const passwordOk = await bcrypt.compare(currentPassword, current.password_hash)
    if (!passwordOk) {
      throw new Error('Senha atual incorreta.')
    }
  }

  const result = newPassword
    ? await db.query(
        `
          UPDATE public.users
          SET email = $2,
              avatar_url = $3,
              password_hash = $4
          WHERE id = $1
          RETURNING id, name, email, avatar_url
        `,
        [user.id, email, avatarUrl, await bcrypt.hash(newPassword, 12)],
      )
    : await db.query(
        `
          UPDATE public.users
          SET email = $2,
              avatar_url = $3
          WHERE id = $1
          RETURNING id, name, email, avatar_url
        `,
        [user.id, email, avatarUrl],
      )

  const updated = result.rows[0]
  return {
    id: updated.id,
    email: updated.email,
    name: updated.name,
    avatar_url: updated.avatar_url,
    role: current.role as DashboardRole,
    em: Date.now(),
  } satisfies ClientSession
}
