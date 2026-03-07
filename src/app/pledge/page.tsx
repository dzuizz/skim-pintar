'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SiteNav } from '@/components/site-nav'
import { Stepper } from '@/components/ui/stepper'
import { Button } from '@/components/ui/button'
import { StepContact } from '@/components/donor/step-contact'
import { StepAmount } from '@/components/donor/step-amount'
import { StepConfirm } from '@/components/donor/step-confirm'

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
}

const STEPS = ['Contact Details', 'Donation Amount', 'Confirm']

const initialFormData: PledgeFormData = {
  name: '',
  phone: '',
  email: '',
  nricLast4: '',
  reminderChannel: 'WHATSAPP',
  amount: 0,
  customAmount: '',
  frequency: 'MONTHLY',
  reminderDay: 1,
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 8) return `+65${digits}`
  if (digits.startsWith('65') && digits.length === 10) return `+${digits}`
  return phone
}

export default function PledgePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<PledgeFormData>(initialFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  function handleChange(partial: Partial<PledgeFormData>) {
    setFormData((prev) => ({ ...prev, ...partial }))
    const keys = Object.keys(partial)
    setErrors((prev) => {
      const next = { ...prev }
      keys.forEach((k) => delete next[k])
      return next
    })
  }

  function validateStep(step: number): boolean {
    const newErrors: Record<string, string> = {}

    if (step === 0) {
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required'
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'Mobile number is required'
      } else {
        const digits = formData.phone.replace(/\D/g, '')
        const valid =
          digits.length === 8 ||
          (digits.startsWith('65') && digits.length === 10)
        if (!valid) {
          newErrors.phone = 'Enter a valid 8-digit Singapore mobile number'
        }
      }
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Enter a valid email address'
      }
    }

    if (step === 1) {
      if (!formData.amount || formData.amount < 1) {
        newErrors.amount = 'Please select or enter an amount (minimum $1)'
      }
    }

    if (step === 2) {
      if (!agreed) {
        newErrors.agreed = 'You must agree to continue'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleNext() {
    if (!validateStep(currentStep)) return
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1))
  }

  function handleBack() {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  async function handleSubmit() {
    if (!validateStep(2)) return

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

  const isLastStep = currentStep === STEPS.length - 1

  return (
    <main className="min-h-screen bg-warmWhite dark:bg-gray-900">
      <SiteNav />

      {/* Page title */}
      <div className="bg-primary-800 pb-6">
        <div className="mx-auto max-w-2xl px-6 pt-4 text-center">
          <h1 className="text-xl font-bold text-white sm:text-2xl">Start Your Pledge</h1>
          <p className="mt-1 text-sm text-primary-200">Set up in under 2 minutes</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="mx-auto max-w-2xl px-6 pt-8 pb-4">
        <Stepper steps={STEPS} currentStep={currentStep} />
      </div>

      {/* Step Content */}
      <div className="mx-auto max-w-2xl px-6 py-6">
        {currentStep === 0 && (
          <StepContact data={formData} onChange={handleChange} errors={errors} />
        )}
        {currentStep === 1 && (
          <StepAmount data={formData} onChange={handleChange} errors={errors} />
        )}
        {currentStep === 2 && (
          <StepConfirm data={formData} agreed={agreed} onAgreeChange={setAgreed} />
        )}

        {/* Submit error */}
        {submitError && (
          <div className="mt-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 text-center">
            <p className="text-sm text-red-600">{submitError}</p>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="mt-8 flex justify-between gap-4">
          {currentStep > 0 ? (
            <Button variant="outline" onClick={handleBack} disabled={submitting}>
              Back
            </Button>
          ) : (
            <div />
          )}

          {isLastStep ? (
            <Button
              variant="secondary"
              size="lg"
              onClick={handleSubmit}
              disabled={submitting || !agreed}
            >
              {submitting ? 'Submitting...' : 'Confirm Pledge'}
            </Button>
          ) : (
            <Button variant="primary" onClick={handleNext}>
              Next
            </Button>
          )}
        </div>
      </div>
    </main>
  )
}
