/**
 * Notification service for sending reminders to donors.
 * MVP: logs to console. Replace with actual SMS/email provider later.
 */

export interface NotificationPayload {
  donorId: number
  donorName: string
  phone: string
  email: string | null
  channel: 'WHATSAPP' | 'SMS' | 'EMAIL'
  type: 'PAYMENT_MISSED' | 'GRACE_WARNING' | 'ACCOUNT_SUSPENDED'
  amount: number
  missedCount: number
  graceDeadline: string | null
}

const messageTemplates: Record<NotificationPayload['type'], (p: NotificationPayload) => string> = {
  PAYMENT_MISSED: (p) =>
    `Assalamualaikum ${p.donorName}, your Skim Pintar donation of $${p.amount} was not received this month. Please make your payment to avoid account suspension. JazakAllahu Khairan.`,
  GRACE_WARNING: (p) =>
    `Assalamualaikum ${p.donorName}, your Skim Pintar account is at risk. You have missed ${p.missedCount} payment(s). Grace period ends ${p.graceDeadline ? new Date(p.graceDeadline).toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' }) : 'soon'}. Please make your payment to keep your account active.`,
  ACCOUNT_SUSPENDED: (p) =>
    `Assalamualaikum ${p.donorName}, your Skim Pintar account has been suspended due to missed payments. Please contact the mosque to reactivate your donation. JazakAllahu Khairan.`,
}

export async function sendNotification(payload: NotificationPayload): Promise<{ sent: boolean; message: string }> {
  const message = messageTemplates[payload.type](payload)

  // MVP: log to console. In production, integrate with:
  // - WhatsApp Business API / Twilio for WHATSAPP
  // - Twilio / AWS SNS for SMS
  // - SendGrid / AWS SES for EMAIL
  console.log(`[NOTIFICATION] ${payload.channel} to ${payload.channel === 'EMAIL' ? payload.email : payload.phone}`)
  console.log(`[NOTIFICATION] Type: ${payload.type} | Donor: ${payload.donorName} (ID: ${payload.donorId})`)
  console.log(`[NOTIFICATION] Message: ${message}`)

  return { sent: true, message }
}

export async function sendBulkNotifications(payloads: NotificationPayload[]): Promise<{ sent: number; failed: number; details: Array<{ donorId: number; type: string; sent: boolean }> }> {
  const details: Array<{ donorId: number; type: string; sent: boolean }> = []
  let sent = 0
  let failed = 0

  for (const payload of payloads) {
    try {
      await sendNotification(payload)
      details.push({ donorId: payload.donorId, type: payload.type, sent: true })
      sent++
    } catch {
      details.push({ donorId: payload.donorId, type: payload.type, sent: false })
      failed++
    }
  }

  return { sent, failed, details }
}
