import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

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

    const donations = await prisma.donation.findMany({
      where: { cycleMonth: month },
      include: {
        donor: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Sort: PENDING first, then RECEIVED, then MISSED
    const statusOrder: Record<string, number> = {
      PENDING: 0,
      RECEIVED: 1,
      MISSED: 2,
    }

    const sorted = donations.sort(
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
