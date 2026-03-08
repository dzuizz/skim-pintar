'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useLocale } from '@/lib/use-locale'

interface GiroData {
  donor: {
    id: number
    fullName: string
    phone: string
    email: string | null
    address: string | null
    postalCode: string | null
    membershipNo: string | null
    tier: string | null
    monthlyAmount: number | null
    giroStatus: string
    bankName: string | null
    remarks: string | null
    status: string | null
    submittedToBankAt: string | null
    bankVerifiedAt: string | null
    firstDeductionAt: string | null
    activatedAt: string | null
    updatedAt: string | null
    trackingUrl: string
  }
  dependants: {
    id: number
    fullName: string
    relationship: string
    phone: string | null
    address: string | null
  }[]
  tracking: {
    id: number
    phase: string
    detail: string | null
    createdAt: string
  }[]
  currentPhaseSince: string | null
  currentPhaseDays: number
}

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
  giro: GiroData | null
  lookupSource: 'paynow' | 'giro' | 'hybrid'
  hasPayNowRecord: boolean
  hasGiroRecord: boolean
}

interface DonorLoginProps {
  onLogin: (data: DonorData) => void
  initialPhone?: string
}

export type { DonorData }

export function DonorLogin({ onLogin, initialPhone = '' }: DonorLoginProps) {
  const t = useLocale()
  const [phone, setPhone] = useState(initialPhone)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoSubmitted, setAutoSubmitted] = useState(false)

  const submitLookup = useCallback(async (phoneValue: string) => {
    setError(null)

    if (!phoneValue.trim()) {
      setError(t.donor.phoneRequired)
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/donors/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneValue.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || t.donor.errorGeneric)
        return
      }

      onLogin(data)
    } catch {
      setError(t.donor.networkError)
    } finally {
      setLoading(false)
    }
  }, [onLogin, t])

  useEffect(() => {
    if (!initialPhone || autoSubmitted) return
    setPhone(initialPhone)
    setAutoSubmitted(true)
    submitLookup(initialPhone)
  }, [autoSubmitted, initialPhone, submitLookup])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await submitLookup(phone)
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
              label={t.donor.phoneLabel}
              type="tel"
              placeholder={t.donor.phonePlaceholder}
              helperText={t.donor.phoneHelper}
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
