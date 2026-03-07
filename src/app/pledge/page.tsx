'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SiteNav } from '@/components/site-nav'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StepContact } from '@/components/donor/step-contact'
import { StepAmount } from '@/components/donor/step-amount'
import { TransparencyPreview } from '@/components/donor/transparency-preview'
import { formatCurrency } from '@/lib/utils'
import { useLocale } from '@/lib/use-locale'

interface PledgeFormData {
  name: string
  phone: string
  email: string
  nricLast4: string
  reminderChannel: 'WHATSAPP' | 'SMS' | 'EMAIL'
  amount: number
  customAmount: string
  frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'
  reminderDay: number
  tier: 'INDIVIDUAL' | 'FAMILY' | 'CUSTOM'
  paymentMethod: 'MANUAL' | 'EGIRO'
}

interface Category {
  category: string
  percentage: number
  description: string
}

const initialFormData: PledgeFormData = {
  name: '',
  phone: '',
  email: '',
  nricLast4: '',
  reminderChannel: 'WHATSAPP',
  amount: 5,
  customAmount: '',
  frequency: 'MONTHLY',
  reminderDay: 1,
  tier: 'INDIVIDUAL',
  paymentMethod: 'MANUAL',
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 8) return `+65${digits}`
  if (digits.startsWith('65') && digits.length === 10) return `+${digits}`
  return phone
}

const frequencyLabels: Record<string, string> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  ANNUAL: 'Annual',
}

const channelLabels: Record<string, string> = {
  WHATSAPP: 'WhatsApp',
  SMS: 'SMS',
  EMAIL: 'Email',
}

const dayLabels: Record<number, string> = {
  1: '1st',
  15: '15th',
  25: '25th',
}

const tierLabels: Record<string, string> = {
  INDIVIDUAL: 'Individual',
  FAMILY: 'Family',
  CUSTOM: 'Custom',
}

function reminderDayLabel(day: number, frequency: string): string {
  const d = dayLabels[day] || `${day}th`
  switch (frequency) {
    case 'QUARTERLY':
      return `${d} of every quarter`
    case 'ANNUAL':
      return `${d} of the year`
    default:
      return `${d} of every month`
  }
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 8) return `+65 ${digits.slice(0, 4)} ${digits.slice(4)}`
  if (digits.startsWith('65') && digits.length === 10)
    return `+65 ${digits.slice(2, 6)} ${digits.slice(6)}`
  return phone
}

export default function PledgePage() {
  const router = useRouter()
  const t = useLocale()
  const [formData, setFormData] = useState<PledgeFormData>(initialFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [welcomeBack, setWelcomeBack] = useState<string | null>(null)
  const [topCategories, setTopCategories] = useState<Category[]>([])

  // Fetch categories on mount
  useEffect(() => {
    fetch('/api/transparency')
      .then((res) => (res.ok ? res.json() : []))
      .then((all: Category[]) => {
        const top3 = all.slice(0, 3)
        const totalPct = top3.reduce((sum, c) => sum + c.percentage, 0)
        const normalized = top3.map((c) => ({
          ...c,
          percentage: totalPct > 0 ? Math.round((c.percentage / totalPct) * 100) : 0,
        }))
        setTopCategories(normalized)
      })
      .catch(() => {})
  }, [])

  function handleChange(partial: Partial<PledgeFormData>) {
    setFormData((prev) => ({ ...prev, ...partial }))
    const keys = Object.keys(partial)
    setErrors((prev) => {
      const next = { ...prev }
      keys.forEach((k) => delete next[k])
      return next
    })
  }

  // Welcome-back: check if phone matches existing member
  async function handlePhoneBlur() {
    const digits = formData.phone.replace(/\D/g, '')
    const valid = digits.length === 8 || (digits.startsWith('65') && digits.length === 10)
    if (!valid) return

    try {
      const phone = normalizePhone(formData.phone)
      const res = await fetch('/api/donors/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.name) {
          setWelcomeBack(data.name)
          handleChange({ name: data.name, email: data.email || '', nricLast4: data.nricLast4 || '' })
        }
      }
    } catch {
      // Silently fail — not critical
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Mobile number is required'
    } else {
      const digits = formData.phone.replace(/\D/g, '')
      const valid = digits.length === 8 || (digits.startsWith('65') && digits.length === 10)
      if (!valid) {
        newErrors.phone = 'Enter a valid 8-digit Singapore mobile number'
      }
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address'
    }

    if (formData.tier === 'CUSTOM' && (!formData.amount || formData.amount < 10)) {
      newErrors.amount = 'Custom amount must be at least $10'
    } else if (!formData.amount || formData.amount < 1) {
      newErrors.amount = 'Please select a giving level'
    }

    if (!agreed) {
      newErrors.agreed = 'You must agree to continue'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      const phone = normalizePhone(formData.phone)

      const res = await fetch('/api/pledges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone,
          email: formData.email.trim() || undefined,
          nricLast4: formData.nricLast4.trim() || undefined,
          reminderChannel: formData.reminderChannel,
          amount: formData.amount,
          frequency: formData.frequency,
          reminderDay: formData.reminderDay,
          tier: formData.tier,
          paymentMethod: formData.paymentMethod,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        setSubmitError(result.error || 'Something went wrong')
        return
      }

      router.push(`/pledge/success?donorId=${result.donorId}&pledgeId=${result.pledgeId}`)
    } catch {
      setSubmitError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-warmWhite dark:bg-gray-900">
      <SiteNav />

      {/* Page title */}
      <div className="bg-primary-800 pb-8">
        <div className="mx-auto max-w-2xl px-6 pt-4 text-center">
          <h1 className="text-xl font-bold text-white sm:text-2xl">{t.pledge.pageTitle}</h1>
          <p className="mt-1 text-sm text-primary-200">{t.pledge.pageSubtitle}</p>
        </div>
      </div>

      {/* Single scrollable form */}
      <div className="mx-auto max-w-2xl px-6 py-8 space-y-8">
        {/* Section 1: Contact Details */}
        <section>
          <h2 className="text-lg font-semibold text-primary-800 dark:text-primary-200 mb-4">
            {t.pledge.sectionDetails}
          </h2>
          <StepContact
            data={formData}
            onChange={handleChange}
            errors={errors}
            welcomeBack={welcomeBack}
            onPhoneBlur={handlePhoneBlur}
          />
        </section>

        {/* Section 2: Membership Tier */}
        <section>
          <h2 className="text-lg font-semibold text-primary-800 dark:text-primary-200 mb-4">
            {t.pledge.sectionGiving}
          </h2>
          <StepAmount data={formData} onChange={handleChange} errors={errors} />
        </section>

        {/* Section 3: Confirmation */}
        <section>
          <h2 className="text-lg font-semibold text-primary-800 dark:text-primary-200 mb-4">
            {t.pledge.sectionConfirm}
          </h2>

          {/* Summary Card */}
          <Card>
            <CardContent className="py-6">
              <h3 className="text-base font-semibold text-primary-800 dark:text-primary-200 mb-4">
                {t.pledge.summaryTitle}
              </h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Name</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{formData.name || '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Mobile</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formData.phone ? formatPhone(formData.phone) : '—'}
                  </dd>
                </div>
                {formData.email && (
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500 dark:text-gray-400">Email</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{formData.email}</dd>
                  </div>
                )}
                <div className="border-t border-gray-100 dark:border-gray-700 pt-3 flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Tier</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {tierLabels[formData.tier]}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Amount</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(formData.amount)} / {frequencyLabels[formData.frequency]?.toLowerCase()}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Reminder Day</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {reminderDayLabel(formData.reminderDay, formData.frequency)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Reminder Via</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {channelLabels[formData.reminderChannel]}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Payment</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formData.paymentMethod === 'EGIRO' ? 'eGIRO (Auto-Debit)' : 'PayNow / Bank Transfer'}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Transparency Preview */}
          {topCategories.length > 0 && (
            <div className="mt-6">
              <TransparencyPreview amount={formData.amount} categories={topCategories} />
            </div>
          )}

          {/* Disclaimer */}
          <div className="mt-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {t.pledge.disclaimer}
            </p>
          </div>

          {/* Agreement checkbox */}
          <label className="mt-4 flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-5 w-5 rounded border-gray-300 text-primary-700 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {t.pledge.agree}
            </span>
          </label>
          {errors.agreed && (
            <p className="mt-1.5 text-xs text-red-600">{errors.agreed}</p>
          )}
        </section>

        {/* Submit error */}
        {submitError && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 text-center">
            <p className="text-sm text-red-600">{submitError}</p>
          </div>
        )}

        {/* Submit button */}
        <div className="pb-8">
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            disabled={submitting || !agreed}
          >
            {submitting ? t.pledge.submitting : t.pledge.submit}
          </Button>
        </div>
      </div>
    </main>
  )
}
