'use client'

import { useEffect, useState } from 'react'
import { TransparencyPreview } from '@/components/donor/transparency-preview'

interface Category {
  category: string
  percentage: number
  description: string
}

interface StepPreviewProps {
  amount: number
}

export function StepPreview({ amount }: StepPreviewProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/transparency')
        if (!res.ok) throw new Error('Failed to load transparency data')
        const data = await res.json()
        setCategories(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-700" />
        <p className="mt-4 text-sm text-gray-500">Loading transparency data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }

  return <TransparencyPreview amount={amount} categories={categories} />
}
