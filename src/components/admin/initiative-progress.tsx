'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

interface Initiative {
  id: number
  name: string
  allocated: number
  target: number
  color: string
}

interface InitiativeProgressProps {
  initiatives: Initiative[]
  totalReceived: number
}

export function InitiativeProgress({ initiatives, totalReceived }: InitiativeProgressProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [targets, setTargets] = useState<Record<number, number>>(() => {
    const map: Record<number, number> = {}
    for (const init of initiatives) {
      map[init.id] = init.target
    }
    return map
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleTargetChange(id: number, value: string) {
    const parsed = parseFloat(value)
    setTargets((prev) => ({ ...prev, [id]: isNaN(parsed) ? 0 : parsed }))
  }

  function handleCancel() {
    const map: Record<number, number> = {}
    for (const init of initiatives) {
      map[init.id] = init.target
    }
    setTargets(map)
    setEditing(false)
    setError(null)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)

    try {
      const updates = initiatives.map((init) => ({
        id: init.id,
        target: targets[init.id] ?? init.target,
      }))

      const res = await fetch('/api/transparency', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }

      setEditing(false)
      startTransition(() => {
        router.refresh()
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save targets')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Initiative Funding</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total received: {formatCurrency(totalReceived)}
            </span>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="p-1.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Edit targets"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-5">
        {initiatives.map((init) => {
          const currentTarget = editing ? (targets[init.id] ?? init.target) : init.target
          const pct = currentTarget > 0 ? Math.min((init.allocated / currentTarget) * 100, 100) : 0
          return (
            <div key={init.id}>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{init.name}</span>
                {editing ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatCurrency(init.allocated)} /
                    </span>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                      <input
                        type="number"
                        min={0}
                        step={100}
                        value={targets[init.id] ?? 0}
                        onChange={(e) => handleTargetChange(init.id, e.target.value)}
                        className="w-24 pl-5 pr-2 py-1 text-xs text-right rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatCurrency(init.allocated)} / {formatCurrency(init.target)}
                  </span>
                )}
              </div>
              <div className="h-2.5 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${init.color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-1 text-right">
                <span className="text-xs text-gray-400 dark:text-gray-500">{Math.round(pct)}%</span>
              </div>
            </div>
          )
        })}

        {editing && (
          <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-700">
            {error && (
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSave} disabled={saving || isPending}>
                {saving ? 'Saving...' : 'Save Targets'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
