import { createHash, randomBytes, timingSafeEqual } from 'crypto'

export function createDocumentAccessToken() {
  return randomBytes(32).toString('base64url')
}

export function hashDocumentAccessToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function isDocumentAccessTokenValid(token: string | null | undefined, tokenHash: string) {
  if (!token) return false
  const hash = hashDocumentAccessToken(token)
  const received = Buffer.from(hash, 'hex')
  const expected = Buffer.from(tokenHash, 'hex')
  return received.length === expected.length && timingSafeEqual(received, expected)
}
