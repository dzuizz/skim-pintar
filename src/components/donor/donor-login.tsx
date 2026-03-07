'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useLocale } from '@/lib/use-locale'

interface DonorData {
  donor: {
    id: number
    name: string
    phone: string
    email: string | null
    address: string | null
    reminderChannel: string
    updatedAt: string | null
  }
  pledge: {
    id: number
    amount: number
    frequency: string
    reminderDay: number
    status: string
    tier: string
    paymentMethod: string
    missedCount: number
    graceDeadline: string | null
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
  dependants: {
    id: number
    name: string
    relationship: string
    nric_last4: string | null
  }[]
}

interface DonorLoginProps {
  onLogin: (data: DonorData) => void
}

export type { DonorData }

export function DonorLogin({ onLogin }: DonorLoginProps) {
  const t = useLocale()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!phone.trim()) {
      setError('Please enter your phone number.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/donors/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
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
              {t.donor.dashboardTitle}
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {t.donor.loginSubtitle}
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
              {loading ? t.donor.lookingUp : t.donor.viewDashboard}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
