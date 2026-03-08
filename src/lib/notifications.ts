/**
 * Notification service for sending reminders to donors.
 * Generates reminder messages that admins can copy and send manually
 * via WhatsApp, SMS, or email.
 */

export type NotificationType = 'REMINDER_UPCOMING' | 'PAYMENT_MISSED' | 'GRACE_WARNING' | 'ACCOUNT_SUSPENDED'

export interface NotificationPayload {
  donorId: number
  donorName: string
  phone: string
  email: string | null
  channel: 'WHATSAPP' | 'SMS' | 'EMAIL'
  type: NotificationType
  amount: number
  missedCount: number
  graceDeadline: string | null
}

const messageTemplates: Record<NotificationType, (p: NotificationPayload) => string> = {
  REMINDER_UPCOMING: (p) =>
    `Assalamualaikum ${p.donorName}, friendly reminder: your Skim Pintar contribution of $${p.amount} is due soon. PayNow to UEN S93MQ0024E. JazakAllahu Khairan.`,
  PAYMENT_MISSED: (p) =>
    `Assalamualaikum ${p.donorName}, your Skim Pintar donation of $${p.amount} was not received this month. Please make your payment to avoid account suspension. PayNow to UEN S93MQ0024E. JazakAllahu Khairan.`,
  GRACE_WARNING: (p) =>
    `Assalamualaikum ${p.donorName}, your Skim Pintar account is at risk. You have missed ${p.missedCount} payment(s). Grace period ends ${p.graceDeadline ? new Date(p.graceDeadline).toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' }) : 'soon'}. Please make your payment to keep your account active. PayNow to UEN S93MQ0024E.`,
  ACCOUNT_SUSPENDED: (p) =>
    `Assalamualaikum ${p.donorName}, your Skim Pintar account has been suspended due to missed payments. Visit your dashboard at skimpintar.com/my to reactivate. JazakAllahu Khairan.`,
}

export function generateMessage(payload: NotificationPayload): string {
  return messageTemplates[payload.type](payload)
}
