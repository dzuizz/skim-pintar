'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface DonorData {
  donor: {
    id: number
    name: string
    phone: string
    email: string | null
    reminderChannel: string
  }
  pledge: {
    id: number
    amount: number
    frequency: string
    reminderDay: number
    status: string
  } | null
  donations: {
    id: number
    amount: number
    reference: string
    cycleMonth: string
    status: string
    receivedAt: string | null
  }[]
  categories: {
    category: string
    percentage: number
    description: string
  }[]
}

interface DonorLoginProps {
  onLogin: (data: DonorData) => void
}

export type { DonorData }

export function DonorLogin({ onLogin }: DonorLoginProps) {
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!phone.trim() || !name.trim()) {
      setError('Please enter both your phone number and name.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/donors/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), name: name.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }

      onLogin(data)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardContent className="py-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-primary-800 dark:text-primary-200">
              Access Your Dashboard
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Enter the phone number and name you used when setting up your pledge
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Phone Number"
              type="tel"
              placeholder="8123 4567"
              helperText="Singapore mobile number (8 digits)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
            />

            <Input
              label="Full Name"
              type="text"
              placeholder="As registered in your pledge"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />

            {error && (
              <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Looking up...' : 'View My Dashboard'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
