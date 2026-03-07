import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if specific donor_id was passed (for admin manual trigger)
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

      // Determine stage and message
      let stage = 1
      let message = ''
      const missedCount = pledge.missed_count || 0

      if (missedCount >= 2) {
        stage = 3
        const deadline = pledge.grace_deadline
          ? new Date(pledge.grace_deadline).toLocaleDateString('en-SG', { day: 'numeric', month: 'long' })
          : 'soon'
        message = `Assalamualaikum ${donor.name}, your Skim Pintar membership may lapse on ${deadline}. Please make your payment of $${pledge.amount} to stay covered. PayNow to UEN S93MQ0024E.`
      } else if (missedCount === 1) {
        stage = 2
        message = `Assalamualaikum ${donor.name}, we noticed your Skim Pintar payment of $${pledge.amount} for this month hasn't arrived. Need any help? PayNow to UEN S93MQ0024E.`
      } else if (today >= pledge.reminder_day - 3 && today <= pledge.reminder_day) {
        stage = 1
        message = `Assalamualaikum ${donor.name}, friendly reminder: your Skim Pintar contribution of $${pledge.amount} is due on the ${pledge.reminder_day}th. PayNow to UEN S93MQ0024E. JazakAllahu Khairan.`
      } else {
        continue // Not due for a reminder
      }

      // Log to reminder_log
      try {
        await supabase.from('reminder_log').insert({
          donor_id: donor.id,
          pledge_id: pledge.id,
          channel: donor.reminder_channel,
          stage,
          message,
        })
      } catch { /* table may not exist */ }

      console.log(`[REMINDER] Stage ${stage} via ${donor.reminder_channel} to ${donor.name}: ${message.slice(0, 80)}...`)

      const ch = donor.reminder_channel.toLowerCase()
      if (ch === 'whatsapp') channels.whatsapp++
      else if (ch === 'sms') channels.sms++
      else channels.email++
      sent++
    }

    return NextResponse.json({ sent, channels })
  } catch (error) {
    console.error('Send reminders error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
