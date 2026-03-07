import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const { data: admins, error } = await supabase
      .from('admins')
      .select('id, name, email, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ admins })
  } catch (error) {
    console.error('Admin list error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    // Validate required fields
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 },
      )
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 },
      )
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 },
      )
    }

    // Check for duplicate email
    const { data: existing } = await supabase
      .from('admins')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'An admin with this email already exists' },
        { status: 409 },
      )
    }

    // Hash password and create admin
    const passwordHash = await bcrypt.hash(password, 10)

    const { data: admin, error: createError } = await supabase
      .from('admins')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password_hash: passwordHash,
      })
      .select('id, name, email, created_at')
      .single()

    if (createError) throw createError

    return NextResponse.json({ admin }, { status: 201 })
  } catch (error) {
    console.error('Admin create error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 },
    )
  }
}
