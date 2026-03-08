import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { generateMessage, type NotificationType } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    // Accept either CRON_SECRET (for cron jobs) or admin session (for dashboard)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    const hasCronAuth = !cronSecret || authHeader === `Bearer ${cronSecret}`

    if (!hasCronAuth) {
      const session = await getServerSession(authOptions)
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Optional: target a specific donor (for admin manual trigger)
    const body = await request.json().catch(() => ({}))
    const targetDonorId = (body as { donorId?: number }).donorId

    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const today = now.getDate()

    // Build query for active pledges
    let query = supabase
      .from('pledges')
      .select('id, donor_id, amount, reminder_day, missed_count, grace_deadline, donors(id, name, phone, email, reminder_channel)')
      .eq('status', 'ACTIVE')

    if (targetDonorId) {
      query = query.eq('donor_id', targetDonorId)
    }

    const { data: pledges, error } = await query
    if (error) throw error

    const channels = { whatsapp: 0, sms: 0, email: 0 }
    let sent = 0
    const messages: { donorName: string; channel: string; stage: number; message: string }[] = []

    for (const pledge of pledges ?? []) {
      const donor = pledge.donors as unknown as { id: number; name: string; phone: string; email: string | null; reminder_channel: string }
      if (!donor) continue

      // Check if already received this month
      const { data: donation } = await supabase
        .from('donations')
        .select('status')
        .eq('pledge_id', pledge.id)
        .eq('cycle_month', currentMonth)
        .maybeSingle()

      if (donation?.status === 'RECEIVED') continue

      // Determine notification type
      const missedCount = pledge.missed_count || 0
      let notificationType: NotificationType | null = null
      let stage = 1

      // For admin-triggered (specific donor), always generate a message
      if (missedCount >= 2) {
        stage = 3
        notificationType = 'GRACE_WARNING'
      } else if (missedCount === 1) {
        stage = 2
        notificationType = 'PAYMENT_MISSED'
      } else if (targetDonorId || (today >= pledge.reminder_day - 3 && today <= pledge.reminder_day)) {
        stage = 1
        notificationType = 'REMINDER_UPCOMING'
      } else {
        continue
      }

      const channel = (donor.reminder_channel || 'WHATSAPP').toUpperCase() as 'WHATSAPP' | 'SMS' | 'EMAIL'

      const message = generateMessage({
        donorId: donor.id,
        donorName: donor.name,
        phone: donor.phone,
        email: donor.email,
        channel,
        type: notificationType,
        amount: pledge.amount,
        missedCount,
        graceDeadline: pledge.grace_deadline,
      })

      // Log to reminder_log for admin to review and send manually
      try {
        await supabase.from('reminder_log').insert({
          donor_id: donor.id,
          pledge_id: pledge.id,
          channel,
          stage,
          message,
        })
      } catch { /* table may not exist */ }

      console.log(`[REMINDER] Stage ${stage} via ${channel} to ${donor.name}: ${message.slice(0, 80)}...`)

      const ch = channel.toLowerCase() as 'whatsapp' | 'sms' | 'email'
      channels[ch]++
      sent++
      messages.push({ donorName: donor.name, channel, stage, message })
    }

    return NextResponse.json({ sent, channels, ...(targetDonorId ? { messages } : {}) })
  } catch (error) {
    console.error('Send reminders error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
