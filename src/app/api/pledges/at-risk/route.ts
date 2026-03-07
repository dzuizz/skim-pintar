import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  // Fetch active pledges with missed_count >= 2 (at-risk of lapsing)
  const { data, error } = await supabase
    .from('pledges')
    .select('id, amount, missed_count, grace_deadline, created_at, donors(id, name, phone, reminder_channel)')
    .eq('status', 'ACTIVE')
    .gte('missed_count', 2)
    .order('missed_count', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const atRisk = (data ?? []).map((p) => {
    const donor = p.donors as unknown as { id: number; name: string; phone: string; reminder_channel: string }
    return {
      pledgeId: p.id,
      donorId: donor?.id,
      donorName: donor?.name ?? 'Unknown',
      phone: donor?.phone ?? '',
      reminderChannel: donor?.reminder_channel ?? 'WHATSAPP',
      amount: Number(p.amount),
      missedCount: p.missed_count,
      graceDeadline: p.grace_deadline,
      pledgedSince: p.created_at,
    }
  })

  return NextResponse.json(atRisk)
}
