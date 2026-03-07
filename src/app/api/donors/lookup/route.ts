import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 8) return `+65${digits}`
  if (digits.startsWith('65') && digits.length === 10) return `+${digits}`
  return phone
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, name } = body as { phone?: string; name?: string }

    if (!phone || !name) {
      return NextResponse.json(
        { error: 'Phone and name are required' },
        { status: 400 },
      )
    }

    const normalizedPhone = normalizePhone(phone)

    // Find donor by phone, then verify name (case-insensitive)
    const donor = await prisma.donor.findUnique({
      where: { phone: normalizedPhone },
    })

    if (!donor || donor.name.toLowerCase() !== name.trim().toLowerCase()) {
      return NextResponse.json(
        { error: 'No matching donor found. Please check your name and phone number.' },
        { status: 404 },
      )
    }

    // Fetch active pledge (most recent)
    const pledge = await prisma.pledge.findFirst({
      where: { donorId: donor.id },
      orderBy: { createdAt: 'desc' },
    })

    // Fetch all donations ordered by cycleMonth desc
    const donations = await prisma.donation.findMany({
      where: { donorId: donor.id },
      orderBy: { cycleMonth: 'desc' },
    })

    // Fetch transparency categories
    const categories = await prisma.transparencyConfig.findMany({
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({
      donor: {
        id: donor.id,
        name: donor.name,
        phone: donor.phone,
        email: donor.email,
        reminderChannel: donor.reminderChannel,
      },
      pledge: pledge
        ? {
            id: pledge.id,
            amount: pledge.amount,
            frequency: pledge.frequency,
            reminderDay: pledge.reminderDay,
            status: pledge.status,
          }
        : null,
      donations: donations.map((d) => ({
        id: d.id,
        amount: d.amount,
        reference: d.reference,
        cycleMonth: d.cycleMonth,
        status: d.status,
        receivedAt: d.receivedAt,
      })),
      categories: categories.map((c) => ({
        category: c.category,
        percentage: c.percentage,
        description: c.description,
      })),
    })
  } catch (error) {
    console.error('Donor lookup error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 },
    )
  }
}
