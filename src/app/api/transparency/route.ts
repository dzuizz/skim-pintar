import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const configs = await prisma.transparencyConfig.findMany({
    orderBy: { sortOrder: 'asc' },
  })

  const categories = configs.map((c) => ({
    category: c.category,
    percentage: c.percentage,
    description: c.description,
  }))

  return NextResponse.json(categories)
}
