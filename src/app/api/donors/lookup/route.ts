import { NextRequest, NextResponse } from 'next/server'
import { fetchGiroLookup } from '@/lib/giro'
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
    const { phone } = body as { phone?: string }

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 },
      )
    }

    const normalizedPhone = normalizePhone(phone)

    const giro = await fetchGiroLookup(normalizedPhone)

    // Find donor by phone
    const { data: donor } = await supabase
      .from('donors')
      .select('*')
      .eq('phone', normalizedPhone)
      .maybeSingle()

    if (!donor && !giro) {
      return NextResponse.json(
        { error: 'No member found with this phone number. Please check and try again.' },
        { status: 404 },
      )
    }

    const donorId = donor?.id ?? null

    // Fetch most recent pledge
    const { data: pledge } = donorId
      ? await supabase
          .from('pledges')
          .select('*')
          .eq('donor_id', donorId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: null }

    // Fetch all donations ordered by cycle_month desc
    const { data: donations } = donorId
      ? await supabase
          .from('donations')
          .select('*')
          .eq('donor_id', donorId)
          .order('cycle_month', { ascending: false })
      : { data: [] }

    // Fetch transparency categories
    const { data: categories } = await supabase
      .from('transparency_config')
      .select('category, percentage, description')
      .order('sort_order', { ascending: true })

    // Fetch dependants (table may not exist yet)
    let dependantsList: Array<{id: number; name: string; relationship: string; nric_last4: string | null}> = []
    if (donorId) {
      try {
        const { data: deps } = await supabase.from('dependants').select('*').eq('donor_id', donorId).order('created_at')
        dependantsList = (deps ?? []).map(d => ({ id: d.id, name: d.name, relationship: d.relationship, nric_last4: d.nric_last4 }))
      } catch { /* table may not exist yet */ }
    }

    const dashboardDonor = donor
      ? {
          id: donor.id,
          name: donor.name,
          phone: donor.phone,
          email: donor.email,
          address: donor.address || null,
          reminderChannel: donor.reminder_channel,
          updatedAt: donor.updated_at,
        }
      : {
          id: giro!.donor.id,
          name: giro!.donor.full_name,
          phone: giro!.donor.phone,
          email: giro!.donor.email,
          address: giro!.donor.address || null,
          reminderChannel: 'WHATSAPP',
          updatedAt: giro!.donor.updated_at,
        }

    return NextResponse.json({
      donor: dashboardDonor,
      pledge: pledge
        ? {
            id: pledge.id,
            amount: pledge.amount,
            frequency: pledge.frequency,
            reminderDay: pledge.reminder_day,
            status: pledge.status,
            tier: pledge.tier || 'INDIVIDUAL',
            paymentMethod: pledge.payment_method || 'MANUAL',
            missedCount: pledge.missed_count || 0,
            graceDeadline: pledge.grace_deadline || null,
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
      dependants: donor
        ? dependantsList
        : (giro?.dependants ?? []).map((dep) => ({
            id: dep.id,
            name: dep.full_name,
            relationship: dep.relationship,
            nric_last4: null,
          })),
      giro: giro
        ? {
            donor: {
              id: giro.donor.id,
              fullName: giro.donor.full_name,
              phone: giro.donor.phone,
              email: giro.donor.email,
              address: giro.donor.address,
              postalCode: giro.donor.postal_code,
              membershipNo: giro.donor.membership_no,
              tier: giro.donor.tier,
              monthlyAmount: giro.donor.monthly_amount,
              giroStatus: giro.donor.giro_status,
              bankName: giro.donor.bank_name,
              remarks: giro.donor.remarks,
              status: giro.donor.status,
              submittedToBankAt: giro.donor.submitted_to_bank_at,
              bankVerifiedAt: giro.donor.bank_verified_at,
              firstDeductionAt: giro.donor.first_deduction_at,
              activatedAt: giro.donor.activated_at,
              updatedAt: giro.donor.updated_at,
              trackingUrl: giro.donor.tracking_url,
            },
            dependants: giro.dependants.map((dep) => ({
              id: dep.id,
              fullName: dep.full_name,
              relationship: dep.relationship,
              phone: dep.phone,
              address: dep.address,
            })),
            tracking: giro.tracking.map((entry) => ({
              id: entry.id,
              phase: entry.phase,
              detail: entry.detail,
              createdAt: entry.created_at,
            })),
            currentPhaseSince: giro.current_phase_since,
            currentPhaseDays: giro.current_phase_days,
          }
        : null,
      lookupSource: donor && giro ? 'hybrid' : donor ? 'paynow' : 'giro',
      hasPayNowRecord: Boolean(donor),
      hasGiroRecord: Boolean(giro),
    })
  } catch (error) {
    console.error('Donor lookup error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 },
    )
  }
}
