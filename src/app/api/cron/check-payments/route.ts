import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateReference } from '@/lib/paynow-qr'

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret (for Vercel Cron)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const today = now.getDate()

    // Get all active pledges
    const { data: activePledges, error: pledgeErr } = await supabase
      .from('pledges')
      .select('id, donor_id, amount, reminder_day, missed_count, grace_deadline')
      .eq('status', 'ACTIVE')

    if (pledgeErr) throw pledgeErr

    let newMissed = 0
    let suspended = 0

    for (const pledge of activePledges ?? []) {
      // Only check if reminder_day + 7 days has passed
      if (today < pledge.reminder_day + 7) continue

      // Check if donation exists for current month
      const { data: donation } = await supabase
        .from('donations')
        .select('id, status')
        .eq('pledge_id', pledge.id)
        .eq('cycle_month', currentMonth)
        .maybeSingle()

      // If already received or doesn't exist yet, handle appropriately
      if (donation?.status === 'RECEIVED') continue

      if (!donation) {
        // Create a MISSED donation record
        const reference = generateReference(pledge.donor_id, currentMonth)
        await supabase.from('donations').insert({
          pledge_id: pledge.id,
          donor_id: pledge.donor_id,
          amount: pledge.amount,
          reference,
          cycle_month: currentMonth,
          status: 'MISSED',
        })
      } else if (donation.status === 'PENDING') {
        // Mark as missed
        await supabase.from('donations').update({ status: 'MISSED' }).eq('id', donation.id)
      } else {
        continue // already MISSED
      }

      newMissed++

      // Increment missed_count
      const newMissedCount = (pledge.missed_count || 0) + 1
      const updates: Record<string, unknown> = { missed_count: newMissedCount }

      if (newMissedCount >= 2 && !pledge.grace_deadline) {
        updates.grace_deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }

      // Auto-cancel if missed >= 3 and grace expired
      if (newMissedCount >= 3 && pledge.grace_deadline && new Date(pledge.grace_deadline) < now) {
        updates.status = 'CANCELLED'
        suspended++
      }

      await supabase.from('pledges').update(updates).eq('id', pledge.id)
    }

    return NextResponse.json({
      checked: (activePledges ?? []).length,
      newMissed,
      suspended,
      month: currentMonth,
    })
  } catch (error) {
    console.error('Check payments error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
