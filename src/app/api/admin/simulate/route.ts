import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateReference } from '@/lib/paynow-qr'
import { sendBulkNotifications, type NotificationPayload } from '@/lib/notifications'

/**
 * POST /api/admin/simulate
 * Simulation actions for MVP demo:
 *   - advance-month: Generate next month's donation records for all active pledges
 *   - mark-received: Mark a specific donation as RECEIVED
 *   - mark-missed: Mark a specific donation as MISSED
 *   - reset-pending: Reset a donation back to PENDING
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body as { action: string }

    switch (action) {
      case 'advance-month': {
        // Find the latest cycle_month in donations
        const { data: latest } = await supabase
          .from('donations')
          .select('cycle_month')
          .order('cycle_month', { ascending: false })
          .limit(1)
          .maybeSingle()

        let nextMonth: string
        if (latest?.cycle_month) {
          const [y, m] = latest.cycle_month.split('-').map(Number)
          const d = new Date(y, m) // month is 0-indexed, so m (1-indexed) = next month
          nextMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        } else {
          const now = new Date()
          nextMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        }

        // Check if donations already exist for this month
        const { data: existing } = await supabase
          .from('donations')
          .select('id')
          .eq('cycle_month', nextMonth)
          .limit(1)

        if (existing && existing.length > 0) {
          return NextResponse.json(
            { error: `Donations for ${nextMonth} already exist` },
            { status: 409 },
          )
        }

        // Get all active pledges (include payment_method if column exists)
        let activePledges
        const { data: p1, error: pe1 } = await supabase
          .from('pledges')
          .select('id, donor_id, amount, payment_method')
          .eq('status', 'ACTIVE')

        if (pe1 && (pe1.code === 'PGRST204' || pe1.message?.includes('payment_method'))) {
          // Column doesn't exist yet, fetch without it
          const { data: p2 } = await supabase
            .from('pledges')
            .select('id, donor_id, amount')
            .eq('status', 'ACTIVE')
          activePledges = (p2 ?? []).map((p) => ({ ...p, payment_method: 'MANUAL' }))
        } else {
          activePledges = (p1 ?? []).map((p) => ({
            ...p,
            payment_method: p.payment_method || 'MANUAL',
          }))
        }

        if (activePledges.length === 0) {
          return NextResponse.json(
            { error: 'No active pledges found' },
            { status: 404 },
          )
        }

        // Create donation records
        // eGIRO pledges are auto-received; manual pledges start as PENDING
        const donations = activePledges.map((p) => ({
          pledge_id: p.id,
          donor_id: p.donor_id,
          amount: p.amount,
          reference: generateReference(p.donor_id, nextMonth),
          cycle_month: nextMonth,
          status: p.payment_method === 'EGIRO' ? 'RECEIVED' : 'PENDING',
          received_at: p.payment_method === 'EGIRO' ? new Date().toISOString() : null,
        }))

        const { error: insertError } = await supabase
          .from('donations')
          .insert(donations)

        if (insertError) throw insertError

        // Mark remaining PENDING donations from previous months as MISSED
        // Step 1: Find them by ID
        const { data: pendingOld, error: pendingOldErr } = await supabase
          .from('donations')
          .select('id, pledge_id, donor_id')
          .eq('status', 'PENDING')
          .lt('cycle_month', nextMonth)

        if (pendingOldErr) {
          console.error('Failed to find old pending donations:', pendingOldErr)
        }

        // Step 2: Update by ID list (guaranteed to work)
        let missedDonations = pendingOld ?? []
        if (missedDonations.length > 0) {
          const ids = missedDonations.map((d) => d.id)
          const { error: missedError } = await supabase
            .from('donations')
            .update({ status: 'MISSED' })
            .in('id', ids)

          if (missedError) {
            console.error('Failed to mark old pending as missed:', missedError)
            missedDonations = []
          }
        }

        // Increment missed_count for pledges that had missed donations
        if (missedDonations && missedDonations.length > 0) {
          const missedPledgeIds = [...new Set(missedDonations.map((d) => d.pledge_id))]

          for (const pledgeId of missedPledgeIds) {
            const { data: pledge } = await supabase
              .from('pledges')
              .select('id, missed_count, grace_deadline')
              .eq('id', pledgeId)
              .single()

            if (!pledge) continue

            const newMissedCount = (pledge.missed_count || 0) + 1
            const graceDeadline = pledge.grace_deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

            await supabase
              .from('pledges')
              .update({
                missed_count: newMissedCount,
                grace_deadline: graceDeadline,
              })
              .eq('id', pledgeId)
          }
        }

        // Auto-suspend pledges whose grace period has expired
        const { data: expiredPledges } = await supabase
          .from('pledges')
          .select('id, amount, donor_id, missed_count, grace_deadline, donors(id, name, phone, email, reminder_channel)')
          .eq('status', 'ACTIVE')
          .not('grace_deadline', 'is', null)
          .lt('grace_deadline', new Date().toISOString())

        let suspendedCount = 0
        const notifications: NotificationPayload[] = []

        if (expiredPledges && expiredPledges.length > 0) {
          for (const pledge of expiredPledges) {
            await supabase
              .from('pledges')
              .update({ status: 'PAUSED' })
              .eq('id', pledge.id)

            suspendedCount++

            const donor = pledge.donors as unknown as { id: number; name: string; phone: string; email: string | null; reminder_channel: string }
            if (donor) {
              notifications.push({
                donorId: donor.id,
                donorName: donor.name,
                phone: donor.phone,
                email: donor.email,
                channel: donor.reminder_channel as 'WHATSAPP' | 'SMS' | 'EMAIL',
                type: 'ACCOUNT_SUSPENDED',
                amount: Number(pledge.amount),
                missedCount: pledge.missed_count || 0,
                graceDeadline: pledge.grace_deadline,
              })
            }
          }
        }

        // Send grace warning notifications to at-risk donors (missed >= 1, not yet suspended)
        const { data: atRiskPledges } = await supabase
          .from('pledges')
          .select('id, amount, missed_count, grace_deadline, donors(id, name, phone, email, reminder_channel)')
          .eq('status', 'ACTIVE')
          .gte('missed_count', 1)

        if (atRiskPledges) {
          for (const pledge of atRiskPledges) {
            const donor = pledge.donors as unknown as { id: number; name: string; phone: string; email: string | null; reminder_channel: string }
            if (donor) {
              notifications.push({
                donorId: donor.id,
                donorName: donor.name,
                phone: donor.phone,
                email: donor.email,
                channel: donor.reminder_channel as 'WHATSAPP' | 'SMS' | 'EMAIL',
                type: (pledge.missed_count || 0) >= 2 ? 'GRACE_WARNING' : 'PAYMENT_MISSED',
                amount: Number(pledge.amount),
                missedCount: pledge.missed_count || 0,
                graceDeadline: pledge.grace_deadline,
              })
            }
          }
        }

        // Send all notifications
        const notifResult = await sendBulkNotifications(notifications)

        // Reset missed_count for pledges that received payment this cycle
        // (eGIRO auto-received pledges should have missed_count reset)
        const egiroPledgeIds = activePledges
          .filter((p) => p.payment_method === 'EGIRO')
          .map((p) => p.id)

        if (egiroPledgeIds.length > 0) {
          for (const pledgeId of egiroPledgeIds) {
            await supabase
              .from('pledges')
              .update({ missed_count: 0, grace_deadline: null })
              .eq('id', pledgeId)
          }
        }

        const egiroCount = donations.filter((d) => d.status === 'RECEIVED').length
        const manualCount = donations.filter((d) => d.status === 'PENDING').length

        return NextResponse.json({
          message: `Advanced to ${nextMonth}`,
          cycleMonth: nextMonth,
          created: donations.length,
          egiroAutoReceived: egiroCount,
          manualPending: manualCount,
          suspended: suspendedCount,
          notificationsSent: notifResult.sent,
        })
      }

      case 'mark-received': {
        const { donationId } = body as { donationId: number }
        if (!donationId) {
          return NextResponse.json({ error: 'donationId required' }, { status: 400 })
        }

        const { data: updated, error } = await supabase
          .from('donations')
          .update({ status: 'RECEIVED', received_at: new Date().toISOString() })
          .eq('id', donationId)
          .select()
          .single()

        if (error) throw error

        // Reset missed_count and grace_deadline when payment received
        if (updated?.pledge_id) {
          await supabase
            .from('pledges')
            .update({ missed_count: 0, grace_deadline: null })
            .eq('id', updated.pledge_id)
        }

        return NextResponse.json(updated)
      }

      case 'mark-missed': {
        const { donationId } = body as { donationId: number }
        if (!donationId) {
          return NextResponse.json({ error: 'donationId required' }, { status: 400 })
        }

        const { data: updated, error } = await supabase
          .from('donations')
          .update({ status: 'MISSED', received_at: null })
          .eq('id', donationId)
          .select()
          .single()

        if (error) throw error
        return NextResponse.json(updated)
      }

      case 'reset-pending': {
        const { donationId } = body as { donationId: number }
        if (!donationId) {
          return NextResponse.json({ error: 'donationId required' }, { status: 400 })
        }

        const { data: updated, error } = await supabase
          .from('donations')
          .update({ status: 'PENDING', received_at: null })
          .eq('id', donationId)
          .select()
          .single()

        if (error) throw error
        return NextResponse.json(updated)
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 },
        )
    }
  } catch (error) {
    console.error('Simulate error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 },
    )
  }
}
