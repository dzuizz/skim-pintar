import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const donorId = searchParams.get('donor_id')
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    let query = supabase
      .from('audit_log')
      .select('*, donors(name)')
      .order('changed_at', { ascending: false })
      .limit(limit)

    if (donorId) {
      query = query.eq('donor_id', parseInt(donorId, 10))
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json(data ?? [])
  } catch (error) {
    console.error('Audit log error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
