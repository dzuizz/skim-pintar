'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLocale } from '@/lib/use-locale'

interface Dependant {
  id: number
  name: string
  relationship: string
  nric_last4: string | null
}

interface DependantsListProps {
  donorId: number
  tier: string
}

export function DependantsList({ donorId, tier }: DependantsListProps) {
  const t = useLocale()
  const [dependants, setDependants] = useState<Dependant[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', relationship: '', nricLast4: '' })
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const canAdd = tier === 'FAMILY' || tier === 'CUSTOM'

  const fetchDependants = useCallback(async () => {
    try {
      const res = await fetch(`/api/donors/${donorId}/dependants`)
      if (res.ok) {
        setDependants(await res.json())
      }
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [donorId])

  useEffect(() => { fetchDependants() }, [fetchDependants])

  async function handleAdd() {
    if (!form.name.trim() || !form.relationship.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/donors/${donorId}/dependants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Failed to add')
        return
      }
      setForm({ name: '', relationship: '', nricLast4: '' })
      setAdding(false)
      await fetchDependants()
    } catch { /* ignore */ } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch(`/api/donors/${donorId}/dependants?dependantId=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setDependants((prev) => prev.filter((d) => d.id !== id))
      }
    } catch { /* ignore */ } finally {
      setDeleteId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t.dashboard.familyMembers}</CardTitle>
          {canAdd && !adding && (
            <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
              {t.dashboard.addMember}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {!canAdd && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t.dashboard.upgradeTier}
          </p>
        )}

        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          </div>
        ) : (
          <>
            {dependants.length === 0 && canAdd && !adding && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t.dashboard.noMembers}
              </p>
            )}

            {dependants.length > 0 && (
              <div className="space-y-2">
                {dependants.map((dep) => (
                  <div key={dep.id} className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-700 p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{dep.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{dep.relationship}</p>
                    </div>
                    {deleteId === dep.id ? (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="text-xs text-red-600" onClick={() => handleDelete(dep.id)}>
                          {t.dashboard.confirm}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => setDeleteId(null)}>
                          {t.dashboard.cancel}
                        </Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" className="text-xs text-red-500" onClick={() => setDeleteId(dep.id)}>
                        {t.dashboard.remove}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {adding && (
              <div className="mt-3 space-y-3 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                <Input label={t.dashboard.name} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                <Input label={t.dashboard.relationship} placeholder="e.g. Spouse, Child, Parent" value={form.relationship} onChange={(e) => setForm((f) => ({ ...f, relationship: e.target.value }))} />
                <Input label={t.dashboard.nricLast4} value={form.nricLast4} onChange={(e) => setForm((f) => ({ ...f, nricLast4: e.target.value }))} />
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={handleAdd} disabled={saving}>
                    {saving ? t.dashboard.adding : t.dashboard.add}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setAdding(false); setForm({ name: '', relationship: '', nricLast4: '' }) }}>
                    {t.dashboard.cancel}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
