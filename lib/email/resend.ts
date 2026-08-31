import { Resend } from 'resend'

let resendClient: Resend | null = null

export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY nao configurada.')
  resendClient ??= new Resend(apiKey)
  return resendClient
}

export function getEmailFrom() {
  const from = process.env.RESEND_FROM
  if (!from) throw new Error('RESEND_FROM nao configurada.')
  return from
}

export function getReplyTo() {
  return process.env.RESEND_REPLY_TO || undefined
}
