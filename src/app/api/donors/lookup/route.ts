import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 8) return `+65${digits}`
  if (digits.startsWith('65') && digits.length === 10) return `+${digits}`
  return phone
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, name } = body as { phone?: string; name?: string }

    if (!phone || !name) {
      return NextResponse.json(
        { error: 'Phone and name are required' },
        { status: 400 },
      )
    }

    const normalizedPhone = normalizePhone(phone)

    // Find donor by phone
    const { data: donor } = await supabase
      .from('donors')
      .select('*')
      .eq('phone', normalizedPhone)
      .maybeSingle()

    if (!donor || donor.name.toLowerCase() !== name.trim().toLowerCase()) {
      return NextResponse.json(
        { error: 'No matching donor found. Please check your name and phone number.' },
        { status: 404 },
      )
    }

    // Fetch most recent pledge
    const { data: pledge } = await supabase
      .from('pledges')
      .select('*')
      .eq('donor_id', donor.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Fetch all donations ordered by cycle_month desc
    const { data: donations } = await supabase
      .from('donations')
      .select('*')
      .eq('donor_id', donor.id)
      .order('cycle_month', { ascending: false })

    // Fetch transparency categories
    const { data: categories } = await supabase
      .from('transparency_config')
      .select('category, percentage, description')
      .order('sort_order', { ascending: true })

    return NextResponse.json({
      donor: {
        id: donor.id,
        name: donor.name,
        phone: donor.phone,
        email: donor.email,
        reminderChannel: donor.reminder_channel,
      },
      pledge: pledge
        ? {
            id: pledge.id,
            amount: pledge.amount,
            frequency: pledge.frequency,
            reminderDay: pledge.reminder_day,
            status: pledge.status,
          }
        : null,
      donations: (donations ?? []).map((d) => ({
        id: d.id,
        amount: d.amount,
        reference: d.reference,
        cycleMonth: d.cycle_month,
        status: d.status,
        receivedAt: d.received_at,
      })),
      categories: (categories ?? []).map((c) => ({
        category: c.category,
        percentage: c.percentage,
        description: c.description,
      })),
    })
  } catch (error) {
    console.error('Donor lookup error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 },
    )
  }
}
