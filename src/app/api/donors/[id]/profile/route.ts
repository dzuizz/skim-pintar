import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const donorId = parseInt(id, 10)
    if (isNaN(donorId)) {
      return NextResponse.json({ error: 'Invalid donor ID' }, { status: 400 })
    }

    const body = await request.json()
    const { name, phone, email, address, reminderChannel } = body as {
      name?: string
      phone?: string
      email?: string
      address?: string
      reminderChannel?: string
    }

    // Fetch current donor
    const { data: current, error: fetchErr } = await supabase
      .from('donors')
      .select('*')
      .eq('id', donorId)
      .single()

    if (fetchErr || !current) {
      return NextResponse.json({ error: 'Donor not found' }, { status: 404 })
    }

    // Build update object and audit entries
    const updates: Record<string, unknown> = {}
    const auditEntries: Array<{ donor_id: number; action: string; field_name: string; old_value: string | null; new_value: string | null }> = []

    if (name !== undefined && name.trim() !== current.name) {
      updates.name = name.trim()
      auditEntries.push({ donor_id: donorId, action: 'UPDATE_PROFILE', field_name: 'name', old_value: current.name, new_value: name.trim() })
    }
    if (email !== undefined && (email?.trim() || null) !== current.email) {
      updates.email = email?.trim() || null
      auditEntries.push({ donor_id: donorId, action: 'UPDATE_PROFILE', field_name: 'email', old_value: current.email, new_value: email?.trim() || null })
    }
    if (address !== undefined && (address?.trim() || null) !== (current.address || null)) {
      updates.address = address?.trim() || null
      auditEntries.push({ donor_id: donorId, action: 'UPDATE_PROFILE', field_name: 'address', old_value: current.address || null, new_value: address?.trim() || null })
    }
    if (reminderChannel !== undefined && reminderChannel !== current.reminder_channel) {
      const valid = ['WHATSAPP', 'SMS', 'EMAIL']
      if (!valid.includes(reminderChannel)) {
        return NextResponse.json({ error: 'Invalid reminder channel' }, { status: 400 })
      }
      updates.reminder_channel = reminderChannel
      auditEntries.push({ donor_id: donorId, action: 'UPDATE_PROFILE', field_name: 'reminder_channel', old_value: current.reminder_channel, new_value: reminderChannel })
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(current)
    }

    // Log audit entries
    if (auditEntries.length > 0) {
      await supabase.from('audit_log').insert(auditEntries)
    }

    // Update donor
    const { data: updated, error: updateErr } = await supabase
      .from('donors')
      .update(updates)
      .eq('id', donorId)
      .select()
      .single()

    if (updateErr) throw updateErr

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
