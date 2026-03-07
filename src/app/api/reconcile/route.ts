import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { parseCSV, matchPayments } from '@/lib/reconcile'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const monthParam = formData.get('month') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No CSV file provided' },
        { status: 400 },
      )
    }

    const csvText = await file.text()
    const bankRows = parseCSV(csvText)

    if (bankRows.length === 0) {
      return NextResponse.json(
        { error: 'No valid rows found in CSV. Ensure headers contain Date, Reference, and Amount.' },
        { status: 400 },
      )
    }

    // Determine month: use provided month or try to detect from first bank row date
    let month = monthParam
    if (!month && bankRows[0].date) {
      // Try to extract YYYY-MM from the date
      const dateMatch = bankRows[0].date.match(/^(\d{4})-(\d{2})/)
      if (dateMatch) {
        month = `${dateMatch[1]}-${dateMatch[2]}`
      }
    }

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      // Default to current month
      const now = new Date()
      month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    }

    // Fetch pending donations for the specified month
    const pendingDonations = await prisma.donation.findMany({
      where: {
        cycleMonth: month,
        status: 'PENDING',
      },
      include: {
        donor: { select: { name: true } },
      },
    })

    const pendingForMatching = pendingDonations.map((d) => ({
      id: d.id,
      reference: d.reference,
      amount: d.amount,
      donorName: d.donor.name,
    }))

    const result = matchPayments(bankRows, pendingForMatching)

    return NextResponse.json({
      month,
      totalBankRows: bankRows.length,
      ...result,
    })
  } catch (error) {
    console.error('Reconcile error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 },
    )
  }
}
