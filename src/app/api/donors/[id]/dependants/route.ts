import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

async function ensureDependantsTable() {
  const { error } = await supabase.from('dependants').select('id').limit(1)
  if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
    // Table doesn't exist — try to create it
    try {
      await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS dependants (
            id SERIAL PRIMARY KEY,
            donor_id INTEGER NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            relationship TEXT NOT NULL,
            nric_last4 TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_dependants_donor_id ON dependants(donor_id);
        `,
      })
    } catch {
      // RPC may not exist — fall through, the insert will fail with a clear message
    }
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const donorId = parseInt(id, 10)
    if (isNaN(donorId)) {
      return NextResponse.json({ error: 'Invalid donor ID' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('dependants')
      .select('*')
      .eq('donor_id', donorId)
      .order('created_at')

    if (error) {
      // Table might not exist — return empty array instead of erroring
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json([])
      }
      throw error
    }
    return NextResponse.json(data ?? [])
  } catch (error) {
    console.error('Dependants fetch error:', error)
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const donorId = parseInt(id, 10)
    if (isNaN(donorId)) {
      return NextResponse.json({ error: 'Invalid donor ID' }, { status: 400 })
    }

    // Check pledge tier
    const { data: pledge } = await supabase
      .from('pledges')
      .select('tier')
      .eq('donor_id', donorId)
      .eq('status', 'ACTIVE')
      .maybeSingle()

    if (!pledge || (pledge.tier !== 'FAMILY' && pledge.tier !== 'CUSTOM')) {
      return NextResponse.json(
        { error: 'Upgrade to Family tier to add dependants' },
        { status: 403 },
      )
    }

    const body = await request.json()
    const { name, relationship, nricLast4 } = body as {
      name?: string
      relationship?: string
      nricLast4?: string
    }

    if (!name?.trim() || !relationship?.trim()) {
      return NextResponse.json({ error: 'Name and relationship are required' }, { status: 400 })
    }

    // Try to ensure the table exists
    await ensureDependantsTable()

    const { data: created, error } = await supabase
      .from('dependants')
      .insert({
        donor_id: donorId,
        name: name.trim(),
        relationship: relationship.trim(),
        nric_last4: nricLast4?.trim() || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Dependant insert error:', error)
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'The dependants table has not been created yet. Please run the migration: supabase/migrations/20260308_add_dependants_audit_reminder.sql' },
          { status: 500 },
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Audit log (non-blocking)
    await supabase.from('audit_log').insert({
      donor_id: donorId,
      action: 'ADD_DEPENDANT',
      field_name: 'dependant',
      new_value: `${name.trim()} (${relationship.trim()})`,
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Add dependant error:', error)
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const donorId = parseInt(id, 10)
    if (isNaN(donorId)) {
      return NextResponse.json({ error: 'Invalid donor ID' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const dependantId = parseInt(searchParams.get('dependantId') || '', 10)
    if (isNaN(dependantId)) {
      return NextResponse.json({ error: 'dependantId required' }, { status: 400 })
    }

    // Verify ownership
    const { data: dep } = await supabase
      .from('dependants')
      .select('id, name, relationship')
      .eq('id', dependantId)
      .eq('donor_id', donorId)
      .single()

    if (!dep) {
      return NextResponse.json({ error: 'Dependant not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('dependants')
      .delete()
      .eq('id', dependantId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Audit log (non-blocking)
    await supabase.from('audit_log').insert({
      donor_id: donorId,
      action: 'REMOVE_DEPENDANT',
      field_name: 'dependant',
      old_value: `${dep.name} (${dep.relationship})`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete dependant error:', error)
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
