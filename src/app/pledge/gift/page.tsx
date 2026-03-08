'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SiteNav } from '@/components/site-nav'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import { useLocale } from '@/lib/use-locale'

const TIERS = [
  { value: 'INDIVIDUAL' as const, amount: 5 },
  { value: 'FAMILY' as const, amount: 20 },
  { value: 'CUSTOM' as const, amount: 10 },
]

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 8) return `+65${digits}`
  if (digits.startsWith('65') && digits.length === 10) return `+${digits}`
  return phone
}

export default function GiftMembershipPage() {
  const router = useRouter()
  const t = useLocale()

  const [gifterName, setGifterName] = useState('')
  const [gifterPhone, setGifterPhone] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [tier, setTier] = useState<'INDIVIDUAL' | 'FAMILY' | 'CUSTOM'>('INDIVIDUAL')
  const [customAmount, setCustomAmount] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const tierLabels: Record<string, string> = {
    INDIVIDUAL: t.pledge.tierIndividual,
    FAMILY: t.pledge.tierFamily,
    CUSTOM: t.pledge.tierCustom,
  }

  const amount = tier === 'CUSTOM'
    ? (parseInt(customAmount, 10) || 10)
    : TIERS.find(t => t.value === tier)!.amount

  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    if (!gifterName.trim()) newErrors.gifterName = t.pledge.nameRequired
    if (!gifterPhone.trim()) {
      newErrors.gifterPhone = t.pledge.phoneRequired
    } else {
      const digits = gifterPhone.replace(/\D/g, '')
      if (digits.length !== 8 && !(digits.startsWith('65') && digits.length === 10)) {
        newErrors.gifterPhone = t.pledge.phoneInvalid
      }
    }

    if (!recipientName.trim()) newErrors.recipientName = t.pledge.nameRequired
    if (!recipientPhone.trim()) {
      newErrors.recipientPhone = t.pledge.phoneRequired
    } else {
      const digits = recipientPhone.replace(/\D/g, '')
      if (digits.length !== 8 && !(digits.startsWith('65') && digits.length === 10)) {
        newErrors.recipientPhone = t.pledge.phoneInvalid
      }
    }

    if (tier === 'CUSTOM' && amount < 10) {
      newErrors.customAmount = t.pledge.customAmountMin
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch('/api/pledges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: recipientName.trim(),
          phone: normalizePhone(recipientPhone),
          reminderChannel: 'WHATSAPP',
          amount,
          frequency: 'MONTHLY',
          reminderDay: 1,
          tier,
          paymentMethod: 'MANUAL',
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

      <div className="bg-primary-800 pb-8">
        <div className="mx-auto max-w-2xl px-6 pt-4 text-center">
          <h1 className="text-xl font-bold text-white sm:text-2xl">Gift a Membership</h1>
          <p className="mt-1 text-sm text-primary-200">
            Sponsor someone&apos;s Skim Pintar membership as a gift of sadaqah jariyah
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-6 py-8 space-y-8">
        {/* Your Details (Gifter) */}
        <section>
          <h2 className="text-lg font-semibold text-primary-800 dark:text-primary-200 mb-4">
            Your Details
          </h2>
          <div className="space-y-4">
            <Input
              label={t.pledge.name}
              placeholder={t.pledge.namePlaceholder}
              value={gifterName}
              onChange={(e) => { setGifterName(e.target.value); setErrors(prev => { const n = { ...prev }; delete n.gifterName; return n }) }}
              error={errors.gifterName}
              required
            />
            <Input
              label={t.pledge.mobileNumber}
              placeholder={t.pledge.mobilePlaceholder}
              value={gifterPhone}
              onChange={(e) => { setGifterPhone(e.target.value); setErrors(prev => { const n = { ...prev }; delete n.gifterPhone; return n }) }}
              error={errors.gifterPhone}
              helperText={t.pledge.mobileHelper}
              required
            />
          </div>
        </section>

        {/* Recipient Details */}
        <section>
          <h2 className="text-lg font-semibold text-primary-800 dark:text-primary-200 mb-4">
            Recipient Details
          </h2>
          <div className="space-y-4">
            <Input
              label={t.pledge.name}
              placeholder="Recipient's full name"
              value={recipientName}
              onChange={(e) => { setRecipientName(e.target.value); setErrors(prev => { const n = { ...prev }; delete n.recipientName; return n }) }}
              error={errors.recipientName}
              required
            />
            <Input
              label={t.pledge.mobileNumber}
              placeholder={t.pledge.mobilePlaceholder}
              value={recipientPhone}
              onChange={(e) => { setRecipientPhone(e.target.value); setErrors(prev => { const n = { ...prev }; delete n.recipientPhone; return n }) }}
              error={errors.recipientPhone}
              helperText="Recipient's Singapore mobile number"
              required
            />
          </div>
        </section>

        {/* Tier Selection */}
        <section>
          <h2 className="text-lg font-semibold text-primary-800 dark:text-primary-200 mb-4">
            {t.pledge.chooseGivingLevel}
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {TIERS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTier(t.value)}
                className={`p-4 rounded border-2 text-left transition-all ${
                  tier === t.value
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-primary-800 dark:text-primary-200">
                  {tierLabels[t.value]}
                </p>
                <p className="text-2xl font-bold text-primary-900 dark:text-white mt-1">
                  {formatCurrency(t.amount)}
                  <span className="text-sm font-normal text-gray-500">/mo</span>
                </p>
              </button>
            ))}
          </div>

          {tier === 'CUSTOM' && (
            <div className="mt-4">
              <Input
                label="Custom amount (min $10)"
                type="number"
                placeholder="10"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                error={errors.customAmount}
                min={10}
              />
            </div>
          )}
        </section>

        {/* Summary */}
        <Card>
          <CardContent className="py-6">
            <h3 className="text-base font-semibold text-primary-800 dark:text-primary-200 mb-4">
              Gift Summary
            </h3>
            <dl className="space-y-2.5">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500 dark:text-gray-400">From</dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{gifterName || '---'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500 dark:text-gray-400">To</dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{recipientName || '---'}</dd>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-700 pt-2.5 flex justify-between">
                <dt className="text-sm text-gray-500 dark:text-gray-400">{t.pledge.summaryTier}</dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{tierLabels[tier]}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500 dark:text-gray-400">{t.pledge.summaryAmount}</dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrency(amount)} / month
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {submitError && (
          <div className="rounded border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 text-center">
            <p className="text-sm text-red-600">{submitError}</p>
          </div>
        )}

        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? t.pledge.submitting : 'Gift This Membership'}
        </Button>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          The recipient will receive a membership under their phone number. You will be shown payment details after confirming.
        </p>
      </div>
    </main>
  )
}
