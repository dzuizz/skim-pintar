import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const donationId = parseInt(id, 10)

    if (isNaN(donationId)) {
      return NextResponse.json(
        { error: 'Invalid donation ID' },
        { status: 400 },
      )
    }

    const body = await request.json()
    const { status, receivedAt } = body as {
      status?: string
      receivedAt?: string
    }

    const validStatuses = ['PENDING', 'RECEIVED', 'MISSED']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be PENDING, RECEIVED, or MISSED.' },
        { status: 400 },
      )
    }

    // Validate the donation exists
    const { data: existing, error: findError } = await supabase
      .from('donations')
      .select('id')
      .eq('id', donationId)
      .single()

    if (findError || !existing) {
      return NextResponse.json(
        { error: 'Donation not found' },
        { status: 404 },
      )
    }

    // Build update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { status }

    if (status === 'RECEIVED' && receivedAt) {
      updateData.received_at = new Date(receivedAt).toISOString()
    } else if (status === 'RECEIVED') {
      updateData.received_at = new Date().toISOString()
    }

    // If marking as non-received, clear received_at
    if (status !== 'RECEIVED') {
      updateData.received_at = null
    }

    const { data: updated, error: updateError } = await supabase
      .from('donations')
      .update(updateData)
      .eq('id', donationId)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({
      id: updated.id,
      amount: updated.amount,
      reference: updated.reference,
      cycleMonth: updated.cycle_month,
      status: updated.status,
      receivedAt: updated.received_at,
    })
  } catch (error) {
    console.error('Donation update error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 },
    )
  }
}
