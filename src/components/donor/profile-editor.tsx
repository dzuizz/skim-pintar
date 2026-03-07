'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useLocale } from '@/lib/use-locale'

interface ProfileEditorProps {
  donor: {
    id: number
    name: string
    email: string | null
    address: string | null
    reminderChannel: string
    updatedAt?: string
  }
  onUpdate?: (updated: ProfileEditorProps['donor']) => void
}

export function ProfileEditor({ donor, onUpdate }: ProfileEditorProps) {
  const t = useLocale()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: donor.name,
    email: donor.email || '',
    address: donor.address || '',
    reminderChannel: donor.reminderChannel,
  })

  async function handleSave() {
    setSaving(true)
    setSuccess(false)
    setError(null)
    try {
      const res = await fetch(`/api/donors/${donor.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          address: form.address,
          reminderChannel: form.reminderChannel,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to save')
      }
      const updated = await res.json()
      const savedDonor = {
        id: donor.id,
        name: updated.name,
        email: updated.email,
        address: updated.address,
        reminderChannel: updated.reminder_channel,
      }
      setForm({
        name: savedDonor.name,
        email: savedDonor.email || '',
        address: savedDonor.address || '',
        reminderChannel: savedDonor.reminderChannel,
      })
      setSuccess(true)
      setEditing(false)
      onUpdate?.(savedDonor)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const channels = [
    { value: 'WHATSAPP', label: 'WhatsApp' },
    { value: 'SMS', label: 'SMS' },
    { value: 'EMAIL', label: 'Email' },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t.dashboard.myProfile}</CardTitle>
          {!editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              {t.dashboard.edit}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {success && (
          <div className="mb-4 rounded-lg border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 p-2">
            <p className="text-xs text-primary-700 dark:text-primary-400">{t.dashboard.profileUpdated}</p>
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-2">
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {editing ? (
          <div className="space-y-3">
            <Input
              label={t.dashboard.name}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Input
              label={t.dashboard.email}
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            <Input
              label={t.dashboard.address}
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.dashboard.remindersVia}
              </label>
              <div className="flex gap-2">
                {channels.map((ch) => (
                  <button
                    key={ch.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, reminderChannel: ch.value }))}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      form.reminderChannel === ch.value
                        ? 'bg-primary-700 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {ch.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="primary" size="sm" onClick={handleSave} disabled={saving}>
                {saving ? t.dashboard.saving : t.dashboard.saveChanges}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => { setEditing(false); setError(null); setForm({ name: donor.name, email: donor.email || '', address: donor.address || '', reminderChannel: donor.reminderChannel }) }}>
                {t.dashboard.cancel}
              </Button>
            </div>
          </div>
        ) : (
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500 dark:text-gray-400">{t.dashboard.name}</dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{donor.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500 dark:text-gray-400">{t.dashboard.email}</dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{donor.email || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500 dark:text-gray-400">{t.dashboard.address}</dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{donor.address || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500 dark:text-gray-400">{t.dashboard.remindersVia}</dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {channels.find((c) => c.value === donor.reminderChannel)?.label || donor.reminderChannel}
              </dd>
            </div>
          </dl>
        )}
      </CardContent>
    </Card>
  )
}
