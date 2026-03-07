import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const donationId = parseInt(id, 10)

    if (isNaN(donationId)) {
      return NextResponse.json(
        { error: 'Invalid donation ID' },
        { status: 400 },
      )
    }

    const body = await request.json()
    const { status, receivedAt } = body as {
      status?: string
      receivedAt?: string
    }

    const validStatuses = ['PENDING', 'RECEIVED', 'MISSED']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be PENDING, RECEIVED, or MISSED.' },
        { status: 400 },
      )
    }

    // Validate the donation exists
    const existing = await prisma.donation.findUnique({
      where: { id: donationId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Donation not found' },
        { status: 404 },
      )
    }

    // Build update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { status }

    if (status === 'RECEIVED' && receivedAt) {
      updateData.receivedAt = new Date(receivedAt)
    } else if (status === 'RECEIVED') {
      updateData.receivedAt = new Date()
    }

    // If marking as non-received, clear receivedAt
    if (status !== 'RECEIVED') {
      updateData.receivedAt = null
    }

    const updated = await prisma.donation.update({
      where: { id: donationId },
      data: updateData,
    })

    return NextResponse.json({
      id: updated.id,
      amount: updated.amount,
      reference: updated.reference,
      cycleMonth: updated.cycleMonth,
      status: updated.status,
      receivedAt: updated.receivedAt,
    })
  } catch (error) {
    console.error('Donation update error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 },
    )
  }
}
