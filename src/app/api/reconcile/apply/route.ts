import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { matchedIds } = body as { matchedIds?: number[] }

    if (!matchedIds || !Array.isArray(matchedIds) || matchedIds.length === 0) {
      return NextResponse.json(
        { error: 'matchedIds must be a non-empty array of donation IDs' },
        { status: 400 },
      )
    }

    // Validate all IDs are numbers
    if (matchedIds.some((id) => typeof id !== 'number' || isNaN(id))) {
      return NextResponse.json(
        { error: 'All matchedIds must be valid numbers' },
        { status: 400 },
      )
    }

    const { data, error } = await supabase
      .from('donations')
      .update({ status: 'RECEIVED', received_at: new Date().toISOString() })
      .in('id', matchedIds)
      .eq('status', 'PENDING')
      .select()

    if (error) throw error

    return NextResponse.json({
      updated: data?.length ?? 0,
      total: matchedIds.length,
    })
  } catch (error) {
    console.error('Reconcile apply error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 },
    )
  }
}
