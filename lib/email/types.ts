export type EmailDeliveryStatus = 'sent' | 'failed' | 'skipped'

export type EmailSendResult = {
  status: EmailDeliveryStatus
  resendEmailId?: string
  error?: string
}

export type WelcomeEmailData = {
  userName: string
  loginUrl: string
}

export type ProtocolReceiptEmailData = {
  requesterName: string
  protocolNumber: string
  createdAt: string
  categoryName: string
  requestTypeName: string
  summary: string
  status: string
  consultationUrl: string
  attachmentsSummary: Array<{ filename: string; sizeLabel: string }>
}

export type ProtocolReceiptPdfDelivery =
  | { mode: 'link'; url: string }
  | { mode: 'attachment'; filename: string; content: Buffer }

export type ProtocolStatusUpdateEmailData = {
  requesterName: string
  protocolNumber: string
  previousStatus: string
  currentStatus: string
  observation: string
  updatedAt: string
  consultationUrl: string
}

export type PasswordResetEmailData = {
  userName: string
  resetUrl: string
  expiresAt: string
}
