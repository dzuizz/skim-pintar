import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

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
    const existing = await prisma.admin.findUnique({
      where: { email: email.trim().toLowerCase() },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'An admin with this email already exists' },
        { status: 409 },
      )
    }

    // Hash password and create admin
    const passwordHash = await bcrypt.hash(password, 10)

    const admin = await prisma.admin.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ admin }, { status: 201 })
  } catch (error) {
    console.error('Admin create error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 },
    )
  }
}
