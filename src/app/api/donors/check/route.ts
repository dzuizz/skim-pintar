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
    const { phone } = body as { phone?: string }

    if (!phone) {
      return NextResponse.json({ error: 'Phone is required' }, { status: 400 })
    }

    const normalizedPhone = normalizePhone(phone)

    const { data: donor } = await supabase
      .from('donors')
      .select('name, email, nric_last4')
      .eq('phone', normalizedPhone)
      .maybeSingle()

    if (!donor) {
      return NextResponse.json({ found: false })
    }

    return NextResponse.json({
      found: true,
      name: donor.name,
      email: donor.email || '',
      nricLast4: donor.nric_last4 || '',
    })
  } catch {
    return NextResponse.json({ found: false })
  }
}
