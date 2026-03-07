import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    let query = supabase
      .from('donors')
      .select('*, pledges(*)')
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) throw error

    let donors = data ?? []

    // Filter by pledge status in JS (no direct Supabase equivalent for "has some pledge with status")
    if (status) {
      donors = donors.filter((d) =>
        d.pledges?.some((p: { status: string }) => p.status === status),
      )
    }

    // Trim pledges to only the most recent one (matching original behavior)
    const result = donors.map((d) => ({
      ...d,
      pledges: d.pledges
        ?.sort((a: { created_at: string }, b: { created_at: string }) =>
          b.created_at.localeCompare(a.created_at),
        )
        .slice(0, 1),
    }))

    return NextResponse.json({ donors: result })
  } catch (error) {
    console.error('Donors list error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 },
    )
  }
}
