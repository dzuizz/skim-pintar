import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateReference } from '@/lib/paynow-qr'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const pledgeId = parseInt(id, 10)
    if (isNaN(pledgeId)) {
      return NextResponse.json({ error: 'Invalid pledge ID' }, { status: 400 })
    }

    // Fetch pledge
    const { data: pledge, error: fetchErr } = await supabase
      .from('pledges')
      .select('*')
      .eq('id', pledgeId)
      .single()

    if (fetchErr || !pledge) {
      return NextResponse.json({ error: 'Pledge not found' }, { status: 404 })
    }

    if (pledge.status !== 'PAUSED' && pledge.status !== 'CANCELLED') {
      return NextResponse.json({ error: 'Only paused or cancelled pledges can be reactivated' }, { status: 400 })
    }

    // Reactivate
    const { data: updated, error: updateErr } = await supabase
      .from('pledges')
      .update({ status: 'ACTIVE', missed_count: 0, grace_deadline: null })
      .eq('id', pledgeId)
      .select()
      .single()

    if (updateErr) throw updateErr

    // Create PENDING donation for current month
    const now = new Date()
    const cycleMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const reference = generateReference(pledge.donor_id, cycleMonth)

    // Check if donation already exists for this month
    const { data: existing } = await supabase
      .from('donations')
      .select('id')
      .eq('pledge_id', pledgeId)
      .eq('cycle_month', cycleMonth)
      .maybeSingle()

    if (!existing) {
      await supabase.from('donations').insert({
        pledge_id: pledgeId,
        donor_id: pledge.donor_id,
        amount: pledge.amount,
        reference,
        cycle_month: cycleMonth,
        status: 'PENDING',
      })
    }

    // Audit log
    try {
      await supabase.from('audit_log').insert({
        donor_id: pledge.donor_id,
        action: 'REACTIVATED',
        field_name: 'pledge_status',
        old_value: pledge.status,
        new_value: 'ACTIVE',
      })
    } catch { /* audit_log table may not exist */ }

    return NextResponse.json({
      id: updated.id,
      amount: updated.amount,
      frequency: updated.frequency,
      reminderDay: updated.reminder_day,
      status: updated.status,
      tier: updated.tier || 'INDIVIDUAL',
      paymentMethod: updated.payment_method || 'MANUAL',
      missedCount: 0,
      graceDeadline: null,
    })
  } catch (error) {
    console.error('Reactivation error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
