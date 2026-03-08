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

  // Pre-select tier from URL query param (e.g. /pledge?tier=FAMILY)
  useEffect(() => {
    const tier = new URLSearchParams(window.location.search).get('tier')
    if (tier === 'INDIVIDUAL') {
      setFormData(prev => ({ ...prev, tier: 'INDIVIDUAL', amount: 5 }))
    } else if (tier === 'FAMILY') {
      setFormData(prev => ({ ...prev, tier: 'FAMILY', amount: 20 }))
    } else if (tier === 'CUSTOM') {
      setFormData(prev => ({ ...prev, tier: 'CUSTOM', amount: 10, customAmount: '10' }))
    }
  }, [])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [welcomeBack, setWelcomeBack] = useState<string | null>(null)
  const [topCategories, setTopCategories] = useState<Category[]>([])

  const tierLabels: Record<string, string> = {
    INDIVIDUAL: t.pledge.tierIndividual,
    FAMILY: t.pledge.tierFamily,
    CUSTOM: t.pledge.tierCustom,
  }

  const frequencyLabels: Record<string, string> = {
    MONTHLY: t.pledge.monthly,
    QUARTERLY: t.pledge.quarterly,
    ANNUAL: t.pledge.annual,
  }

  function reminderDayLabel(day: number, frequency: string): string {
    const d = dayLabels[day] || `${day}th`
    switch (frequency) {
      case 'QUARTERLY':
        return `${d} ${t.pledge.dayOfQuarter}`
      case 'ANNUAL':
        return `${d} ${t.pledge.dayOfYear}`
      default:
        return `${d} ${t.pledge.dayOfMonth}`
    }
  }

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
    if ('phone' in partial) {
      setWelcomeBack(null)
    }
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
        }
      }
    } catch {
      // Silently fail — not critical
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = t.pledge.nameRequired
    }
    if (!formData.phone.trim()) {
      newErrors.phone = t.pledge.phoneRequired
    } else {
      const digits = formData.phone.replace(/\D/g, '')
      const valid = digits.length === 8 || (digits.startsWith('65') && digits.length === 10)
      if (!valid) {
        newErrors.phone = t.pledge.phoneInvalid
      }
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t.pledge.emailInvalid
    }

    if (formData.tier === 'CUSTOM' && (!formData.amount || formData.amount < 10)) {
      newErrors.amount = t.pledge.customAmountMin
    } else if (!formData.amount || formData.amount < 1) {
      newErrors.amount = t.pledge.amountRequired
    }

    if (!agreed) {
      newErrors.agreed = t.pledge.agreeRequired
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit() {
    if (welcomeBack) {
      setSubmitError(t.pledge.existingAccount)
      return
    }
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
      setSubmitError(t.pledge.networkError)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-warmWhite dark:bg-gray-900">
      <SiteNav />

      {/* Page title */}
      <div className="bg-primary-800 pb-8">
        <div className="mx-auto max-w-5xl px-6 pt-4 text-center">
          <h1 className="text-xl font-bold text-white sm:text-2xl">{t.pledge.pageTitle}</h1>
          <p className="mt-1 text-sm text-primary-200">{t.pledge.pageSubtitle}</p>
        </div>
      </div>

      {/* Two-column layout on desktop */}
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="lg:grid lg:grid-cols-5 lg:gap-8">
          {/* Left column: Form */}
          <div className="lg:col-span-3 space-y-8">
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
          </div>

          {/* Right column: Summary (sticky on desktop) */}
          <div className="lg:col-span-2 mt-8 lg:mt-0">
            <div className="lg:sticky lg:top-20 space-y-6">
              {/* Summary Card */}
              <Card>
                <CardContent className="py-6">
                  <h3 className="text-base font-semibold text-primary-800 dark:text-primary-200 mb-4">
                    {t.pledge.summaryTitle}
                  </h3>
                  <dl className="space-y-3">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500 dark:text-gray-400">{t.pledge.summaryName}</dt>
                      <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{formData.name || '—'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500 dark:text-gray-400">{t.pledge.summaryMobile}</dt>
                      <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formData.phone ? formatPhone(formData.phone) : '—'}
                      </dd>
                    </div>
                    {formData.email && (
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500 dark:text-gray-400">{t.pledge.summaryEmail}</dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{formData.email}</dd>
                      </div>
                    )}
                    <div className="border-t border-gray-100 dark:border-gray-700 pt-3 flex justify-between">
                      <dt className="text-sm text-gray-500 dark:text-gray-400">{t.pledge.summaryTier}</dt>
                      <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {tierLabels[formData.tier]}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500 dark:text-gray-400">{t.pledge.summaryAmount}</dt>
                      <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(formData.amount)} / {frequencyLabels[formData.frequency]?.toLowerCase()}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500 dark:text-gray-400">{t.pledge.summaryReminderDay}</dt>
                      <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {reminderDayLabel(formData.reminderDay, formData.frequency)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500 dark:text-gray-400">{t.pledge.summaryReminderVia}</dt>
                      <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {channelLabels[formData.reminderChannel]}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500 dark:text-gray-400">{t.pledge.summaryPayment}</dt>
                      <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formData.paymentMethod === 'EGIRO' ? t.pledge.egiro : t.pledge.payNowTransfer}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {/* Transparency Preview */}
              {topCategories.length > 0 && (
                <TransparencyPreview amount={formData.amount} categories={topCategories} />
              )}

              {/* Disclaimer */}
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {t.pledge.disclaimer}
                </p>
              </div>

              {/* Agreement checkbox */}
              <label className="flex items-start gap-3 cursor-pointer">
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
                <p className="text-xs text-red-600">{errors.agreed}</p>
              )}

              {/* Submit error */}
              {submitError && (
                <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 text-center">
                  <p className="text-sm text-red-600">{submitError}</p>
                </div>
              )}

              {/* Submit button */}
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
        </div>
      </div>
    </main>
  )
}
