import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const pledgeId = parseInt(id, 10)

    if (isNaN(pledgeId)) {
      return NextResponse.json(
        { error: 'Invalid pledge ID' },
        { status: 400 },
      )
    }

    const body = await request.json()
    const { status, graceDeadline, tier, amount } = body as {
      status?: string
      graceDeadline?: string
      tier?: string
      amount?: number
    }

    // Must provide at least one field to update
    if (!status && !graceDeadline && !tier) {
      return NextResponse.json(
        { error: 'Must provide status, graceDeadline, or tier to update.' },
        { status: 400 },
      )
    }

    const validStatuses = ['PAUSED', 'CANCELLED', 'ACTIVE']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be PAUSED, CANCELLED, or ACTIVE.' },
        { status: 400 },
      )
    }

    const validTiers = ['INDIVIDUAL', 'FAMILY', 'CUSTOM']
    if (tier && !validTiers.includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier.' },
        { status: 400 },
      )
    }

    // Validate the pledge exists
    const { data: existing, error: findError } = await supabase
      .from('pledges')
      .select('*')
      .eq('id', pledgeId)
      .single()

    if (findError || !existing) {
      return NextResponse.json(
        { error: 'Pledge not found' },
        { status: 404 },
      )
    }

    // Build update object
    const updateFields: Record<string, unknown> = {}
    if (status) updateFields.status = status
    if (graceDeadline) updateFields.grace_deadline = graceDeadline

    // Handle tier change
    if (tier && tier !== existing.tier) {
      const tierAmounts: Record<string, number> = { INDIVIDUAL: 5, FAMILY: 20, CUSTOM: 10 }
      const newAmount = tier === 'CUSTOM' ? (amount || tierAmounts.CUSTOM) : tierAmounts[tier]
      updateFields.tier = tier
      updateFields.amount = newAmount

      // Calculate delta for pending donation adjustment
      const oldAmount = existing.amount
      const delta = newAmount - oldAmount
      const now = new Date()
      const cycleMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

      // Check if there's a pending donation for current month
      const { data: pendingDonation } = await supabase
        .from('donations')
        .select('*')
        .eq('pledge_id', pledgeId)
        .eq('cycle_month', cycleMonth)
        .eq('status', 'PENDING')
        .single()

      if (pendingDonation) {
        // Update the pending donation to the new amount
        await supabase
          .from('donations')
          .update({ amount: newAmount })
          .eq('id', pendingDonation.id)
      } else {
        // Check if already paid this month
        const { data: receivedDonation } = await supabase
          .from('donations')
          .select('*')
          .eq('pledge_id', pledgeId)
          .eq('cycle_month', cycleMonth)
          .eq('status', 'RECEIVED')
          .single()

        if (receivedDonation && delta > 0) {
          // Create a new pending donation for just the delta
          const ref = `SP-${existing.donor_id}-${cycleMonth.replace('-', '')}-ADJ`
          await supabase.from('donations').insert({
            pledge_id: pledgeId,
            donor_id: existing.donor_id,
            amount: delta,
            cycle_month: cycleMonth,
            status: 'PENDING',
            reference: ref,
          })
        }
      }
    }

    // Update pledge
    const { data: updated, error: updateError } = await supabase
      .from('pledges')
      .update(updateFields)
      .eq('id', pledgeId)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({
      id: updated.id,
      amount: updated.amount,
      frequency: updated.frequency,
      reminderDay: updated.reminder_day,
      status: updated.status,
      tier: updated.tier || 'INDIVIDUAL',
      paymentMethod: updated.payment_method || 'MANUAL',
      missedCount: updated.missed_count || 0,
      graceDeadline: updated.grace_deadline || null,
    })
  } catch (error) {
    console.error('Pledge update error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 },
    )
  }
}
