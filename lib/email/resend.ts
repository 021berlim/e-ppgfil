import { Resend } from 'resend'

let resendClient: Resend | null = null

function normalizeEnvValue(value: string | undefined) {
  const normalized = value?.trim()
  if (!normalized) return undefined
  const first = normalized[0]
  const last = normalized.at(-1)
  return (first === '"' && last === '"') || (first === "'" && last === "'")
    ? normalized.slice(1, -1).trim()
    : normalized
}

export function getResendClient() {
  const apiKey = normalizeEnvValue(process.env.RESEND_API_KEY)
  if (!apiKey) throw new Error('RESEND_API_KEY nao configurada.')
  resendClient ??= new Resend(apiKey)
  return resendClient
}

export function getEmailFrom() {
  const from = normalizeEnvValue(process.env.RESEND_FROM)
  if (!from) throw new Error('RESEND_FROM nao configurada.')
  return from
}

export function getReplyTo() {
  return normalizeEnvValue(process.env.RESEND_REPLY_TO)
}
