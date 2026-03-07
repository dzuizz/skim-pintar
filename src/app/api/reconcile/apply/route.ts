import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

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

    const now = new Date()

    // Update all specified donations to RECEIVED
    const updateResult = await prisma.donation.updateMany({
      where: {
        id: { in: matchedIds },
        status: 'PENDING',
      },
      data: {
        status: 'RECEIVED',
        receivedAt: now,
      },
    })

    return NextResponse.json({
      updated: updateResult.count,
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
