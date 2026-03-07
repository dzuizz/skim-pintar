import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: 'Invalid month format. Use YYYY-MM.' },
        { status: 400 },
      )
    }

    const { data: donations, error } = await supabase
      .from('donations')
      .select('*, donors(name)')
      .eq('cycle_month', month)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Sort: PENDING first, then RECEIVED, then MISSED
    const statusOrder: Record<string, number> = {
      PENDING: 0,
      RECEIVED: 1,
      MISSED: 2,
    }

    const sorted = (donations ?? []).sort(
      (a, b) => (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3),
    )

    return NextResponse.json(sorted)
  } catch (error) {
    console.error('Donations fetch error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 },
    )
  }
}
