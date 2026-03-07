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
    const { status, graceDeadline } = body as { status?: string; graceDeadline?: string }

    // Must provide at least one field to update
    if (!status && !graceDeadline) {
      return NextResponse.json(
        { error: 'Must provide status or graceDeadline to update.' },
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

    // Validate the pledge exists
    const { data: existing, error: findError } = await supabase
      .from('pledges')
      .select('id')
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
