import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const configs = await prisma.transparencyConfig.findMany({
    orderBy: { sortOrder: 'asc' },
  })

  const categories = configs.map((c) => ({
    id: c.id,
    category: c.category,
    percentage: c.percentage,
    description: c.description,
    sortOrder: c.sortOrder,
  }))

  return NextResponse.json(categories)
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const categories: {
      id?: number
      category: string
      percentage: number
      description: string
      sortOrder: number
    }[] = body

    // Validate input
    if (!Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json(
        { error: 'Categories must be a non-empty array' },
        { status: 400 },
      )
    }

    // Validate each category
    for (const cat of categories) {
      if (!cat.category || cat.category.trim() === '') {
        return NextResponse.json(
          { error: 'Each category must have a name' },
          { status: 400 },
        )
      }
      if (typeof cat.percentage !== 'number' || cat.percentage < 0 || cat.percentage > 100) {
        return NextResponse.json(
          { error: `Invalid percentage for "${cat.category}": must be 0-100` },
          { status: 400 },
        )
      }
    }

    // Validate percentages sum to 100
    const total = categories.reduce((sum, cat) => sum + cat.percentage, 0)
    if (total !== 100) {
      return NextResponse.json(
        { error: `Percentages must sum to 100% (currently ${total}%)` },
        { status: 400 },
      )
    }

    // Update all categories in a transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Delete existing categories
      await tx.transparencyConfig.deleteMany()

      // Create new categories
      const results = []
      for (let i = 0; i < categories.length; i++) {
        const cat = categories[i]
        const created = await tx.transparencyConfig.create({
          data: {
            category: cat.category.trim(),
            percentage: cat.percentage,
            description: cat.description.trim(),
            sortOrder: cat.sortOrder ?? i,
          },
        })
        results.push(created)
      }
      return results
    })

    const result = updated.map((c) => ({
      id: c.id,
      category: c.category,
      percentage: c.percentage,
      description: c.description,
      sortOrder: c.sortOrder,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to update transparency config:', error)
    return NextResponse.json(
      { error: 'Failed to update transparency configuration' },
      { status: 500 },
    )
  }
}
