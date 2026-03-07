import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const pledgeId = parseInt(id, 10)

    if (isNaN(pledgeId)) {
      return NextResponse.json(
        { error: 'Invalid pledge ID' },
        { status: 400 },
      )
    }

    const body = await request.json()
    const { status } = body as { status?: string }

    const validStatuses = ['PAUSED', 'CANCELLED', 'ACTIVE']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be PAUSED, CANCELLED, or ACTIVE.' },
        { status: 400 },
      )
    }

    // Validate the pledge exists
    const existing = await prisma.pledge.findUnique({
      where: { id: pledgeId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Pledge not found' },
        { status: 404 },
      )
    }

    // Update pledge status
    const updated = await prisma.pledge.update({
      where: { id: pledgeId },
      data: { status },
    })

    return NextResponse.json({
      id: updated.id,
      amount: updated.amount,
      frequency: updated.frequency,
      reminderDay: updated.reminderDay,
      status: updated.status,
    })
  } catch (error) {
    console.error('Pledge update error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 },
    )
  }
}
