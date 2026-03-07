import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('transparency_config')
    .select('id, category, percentage, description, sort_order')
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const categories = (data ?? []).map((c) => ({
    id: c.id,
    category: c.category,
    percentage: c.percentage,
    description: c.description,
    sortOrder: c.sort_order,
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

    // Delete all existing
    await supabase.from('transparency_config').delete().neq('id', 0)

    // Insert new ones
    const { data: updated, error: insertError } = await supabase
      .from('transparency_config')
      .insert(categories.map((cat, i) => ({
        category: cat.category.trim(),
        percentage: cat.percentage,
        description: cat.description.trim(),
        sort_order: cat.sortOrder ?? i,
      })))
      .select()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    const result = (updated ?? []).map((c) => ({
      id: c.id,
      category: c.category,
      percentage: c.percentage,
      description: c.description,
      sortOrder: c.sort_order,
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
