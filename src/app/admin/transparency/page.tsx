'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TransparencyPreview } from '@/components/donor/transparency-preview'

interface CategoryRow {
  id?: number
  category: string
  percentage: number
  description: string
  sortOrder: number
  target: number
}

export default function TransparencyConfigPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/transparency')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setCategories(
        data.map((c: CategoryRow, i: number) => ({
          id: c.id,
          category: c.category,
          percentage: c.percentage,
          description: c.description,
          sortOrder: c.sortOrder ?? i,
          target: c.target ?? 0,
        })),
      )
    } catch {
      setMessage({ type: 'error', text: 'Failed to load categories' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const total = categories.reduce((sum, cat) => sum + cat.percentage, 0)
  const isValid = total === 100

  const updateCategory = (index: number, field: keyof CategoryRow, value: string | number) => {
    setCategories((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
    setMessage(null)
  }

  const addCategory = () => {
    setCategories((prev) => [
      ...prev,
      {
        category: '',
        percentage: 0,
        description: '',
        sortOrder: prev.length,
        target: 0,
      },
    ])
    setMessage(null)
  }

  const removeCategory = (index: number) => {
    setCategories((prev) => prev.filter((_, i) => i !== index).map((c, i) => ({ ...c, sortOrder: i })))
    setMessage(null)
  }

  const handleSave = async () => {
    if (!isValid) return

    setSaving(true)
    setMessage(null)

    try {
      const payload = categories.map((c, i) => ({
        id: c.id,
        category: c.category,
        percentage: c.percentage,
        description: c.description,
        sortOrder: i,
        target: c.target,
      }))

      const res = await fetch('/api/transparency', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save')
      }

      const data = await res.json()
      setCategories(
        data.map((c: CategoryRow) => ({
          id: c.id,
          category: c.category,
          percentage: c.percentage,
          description: c.description,
          sortOrder: c.sortOrder,
          target: c.target ?? 0,
        })),
      )
      setMessage({ type: 'success', text: 'Transparency configuration saved successfully' })
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to save changes',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-primary-700">
          <svg
            className="animate-spin h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-sm font-medium">Loading configuration...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fund Allocation Categories</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Configure how donation allocations are displayed to donors.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Warning banner */}
              {!isValid && categories.length > 0 && (
                <div className="rounded bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                  Percentages must sum to 100% (currently {total}%)
                </div>
              )}

              {/* Category rows */}
              {categories.map((cat, index) => (
                <div
                  key={index}
                  className="rounded border border-gray-200 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Category {index + 1}
                    </span>
                    {categories.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCategory(index)}
                        className="text-sm text-red-500 hover:text-red-700 font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_100px_120px] gap-3">
                    <Input
                      label="Name"
                      placeholder="e.g., Building Maintenance"
                      value={cat.category}
                      onChange={(e) => updateCategory(index, 'category', e.target.value)}
                    />
                    <Input
                      label="Percentage"
                      type="number"
                      min={0}
                      max={100}
                      placeholder="0"
                      value={cat.percentage}
                      onChange={(e) =>
                        updateCategory(index, 'percentage', parseInt(e.target.value) || 0)
                      }
                    />
                    <Input
                      label="Annual Target"
                      type="number"
                      min={0}
                      step={100}
                      placeholder="0"
                      value={cat.target}
                      onChange={(e) =>
                        updateCategory(index, 'target', parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                  <Input
                    label="Description"
                    placeholder="Brief description of this allocation"
                    value={cat.description}
                    onChange={(e) => updateCategory(index, 'description', e.target.value)}
                  />
                </div>
              ))}

              {/* Add category button */}
              <Button variant="outline" size="sm" onClick={addCategory} className="w-full">
                + Add Category
              </Button>

              {/* Total indicator */}
              <div className="flex items-center justify-between rounded bg-gray-50 px-4 py-3">
                <span className="text-sm font-medium text-gray-700">Total</span>
                <span
                  className={`text-sm font-bold ${
                    isValid ? 'text-primary-600' : 'text-red-600'
                  }`}
                >
                  {total}%
                </span>
              </div>

              {/* Status message */}
              {message && (
                <div
                  className={`rounded px-4 py-3 text-sm ${
                    message.type === 'success'
                      ? 'bg-primary-50 border border-primary-200 text-primary-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}
                >
                  {message.text}
                </div>
              )}

              {/* Save button */}
              <Button
                size="lg"
                className="w-full"
                disabled={!isValid || saving}
                onClick={handleSave}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview Section */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Live Preview
          </h2>
          <TransparencyPreview
            amount={50}
            categories={categories
              .filter((c) => c.category.trim() !== '')
              .map((c) => ({
                category: c.category,
                percentage: c.percentage,
                description: c.description,
              }))}
          />
        </div>
      </div>
    </div>
  )
}
