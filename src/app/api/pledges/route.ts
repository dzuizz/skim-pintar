import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateReference } from '@/lib/paynow-qr'

interface PledgeRequestBody {
  name: string
  phone: string
  email?: string
  nricLast4?: string
  reminderChannel: 'WHATSAPP' | 'SMS' | 'EMAIL'
  amount: number
  frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'
  reminderDay: number
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 8) return `+65${digits}`
  if (digits.startsWith('65') && digits.length === 10) return `+${digits}`
  return phone
}

function validateBody(body: unknown): { data: PledgeRequestBody; errors: string[] } {
  const errors: string[] = []
  const b = body as Record<string, unknown>

  if (!b.name || typeof b.name !== 'string' || b.name.trim().length === 0) {
    errors.push('Name is required')
  }

  if (!b.phone || typeof b.phone !== 'string') {
    errors.push('Phone number is required')
  } else {
    const digits = (b.phone as string).replace(/\D/g, '')
    const valid =
      (digits.length === 8) ||
      (digits.startsWith('65') && digits.length === 10)
    if (!valid) {
      errors.push('Phone must be a valid Singapore mobile number (8 digits)')
    }
  }

  if (typeof b.amount !== 'number' || b.amount < 1) {
    errors.push('Amount must be at least $1')
  }

  const validFrequencies = ['MONTHLY', 'QUARTERLY', 'ANNUAL']
  if (!validFrequencies.includes(b.frequency as string)) {
    errors.push('Invalid frequency')
  }

  const validDays = [1, 15, 25]
  if (!validDays.includes(b.reminderDay as number)) {
    errors.push('Invalid reminder day')
  }

  const validChannels = ['WHATSAPP', 'SMS', 'EMAIL']
  if (!validChannels.includes(b.reminderChannel as string)) {
    errors.push('Invalid reminder channel')
  }

  return {
    data: b as unknown as PledgeRequestBody,
    errors,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, errors } = validateBody(body)

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 })
    }

    const phone = normalizePhone(data.phone)

    // Try to find existing donor by phone
    const { data: existingDonor } = await supabase
      .from('donors')
      .select('*')
      .eq('phone', phone)
      .maybeSingle()

    let donor
    if (existingDonor) {
      // Update existing donor
      const { data: updated, error } = await supabase
        .from('donors')
        .update({
          name: data.name.trim(),
          email: data.email?.trim() || null,
          nric_last4: data.nricLast4?.trim() || null,
          reminder_channel: data.reminderChannel,
        })
        .eq('id', existingDonor.id)
        .select()
        .single()

      if (error) throw error
      donor = updated
    } else {
      // Create new donor
      const { data: created, error } = await supabase
        .from('donors')
        .insert({
          name: data.name.trim(),
          phone,
          email: data.email?.trim() || null,
          nric_last4: data.nricLast4?.trim() || null,
          reminder_channel: data.reminderChannel,
        })
        .select()
        .single()

      if (error) throw error
      donor = created
    }

    // Check for existing active pledge
    const { data: existingPledge } = await supabase
      .from('pledges')
      .select('id')
      .eq('donor_id', donor.id)
      .eq('status', 'ACTIVE')
      .maybeSingle()

    if (existingPledge) {
      return NextResponse.json(
        { error: 'You already have an active pledge' },
        { status: 409 },
      )
    }

    // Create the pledge
    const { data: pledge, error: pledgeError } = await supabase
      .from('pledges')
      .insert({
        donor_id: donor.id,
        amount: data.amount,
        frequency: data.frequency,
        reminder_day: data.reminderDay,
        status: 'ACTIVE',
      })
      .select()
      .single()

    if (pledgeError) throw pledgeError

    // Generate current cycle month (YYYY-MM)
    const now = new Date()
    const cycleMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    // Generate reference
    const reference = generateReference(donor.id, cycleMonth)

    // Create first donation record
    const { error: donationError } = await supabase
      .from('donations')
      .insert({
        pledge_id: pledge.id,
        donor_id: donor.id,
        amount: data.amount,
        reference,
        cycle_month: cycleMonth,
        status: 'PENDING',
      })

    if (donationError) throw donationError

    return NextResponse.json({
      donorId: donor.id,
      pledgeId: pledge.id,
      reference,
    })
  } catch (error) {
    console.error('Pledge creation error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 },
    )
  }
}
