'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge, type BadgeVariant } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TransparencyPreview } from '@/components/donor/transparency-preview'
import { PaymentMethods } from '@/components/donor/payment-methods'
import { formatCurrency } from '@/lib/utils'
import type { DonorData } from '@/components/donor/donor-login'

interface DonorDashboardProps {
  data: DonorData
}

type ConfirmAction = 'pause' | 'cancel' | 'resume' | null

const tierLabels: Record<string, string> = {
  INDIVIDUAL: 'Individual',
  FAMILY: 'Family',
  CUSTOM: 'Custom',
}

const tierBenefits: Record<string, string[]> = {
  INDIVIDUAL: ['Community donor benefits', 'Funeral coverage (Khidmat Jenazah)', '20% course discount'],
  FAMILY: ['Family funeral coverage', '50% course discount', 'All Individual benefits'],
  CUSTOM: ['All Individual benefits', 'Flexible donation amount'],
}

function pledgeStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case 'ACTIVE':
      return 'active'
    case 'PAUSED':
      return 'paused'
    case 'CANCELLED':
      return 'cancelled'
    default:
      return 'pending'
  }
}

function donationStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case 'RECEIVED':
      return 'received'
    case 'MISSED':
      return 'missed'
    default:
      return 'pending'
  }
}

function formatMonth(cycleMonth: string): string {
  const [year, month] = cycleMonth.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('en-SG', { month: 'long', year: 'numeric' })
}

function frequencyLabel(freq: string): string {
  switch (freq) {
    case 'MONTHLY':
      return 'Monthly'
    case 'QUARTERLY':
      return 'Quarterly'
    case 'ANNUAL':
      return 'Annual'
    default:
      return freq
  }
}

function channelLabel(channel: string): string {
  switch (channel) {
    case 'WHATSAPP':
      return 'WhatsApp'
    case 'SMS':
      return 'SMS'
    case 'EMAIL':
      return 'Email'
    default:
      return channel
  }
}

function ordinalDay(day: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd']
  const v = day % 100
  return day + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0])
}

function reminderLabel(day: number, frequency: string): string {
  const d = ordinalDay(day)
  switch (frequency) {
    case 'QUARTERLY':
      return `${d} of every quarter`
    case 'ANNUAL':
      return `${d} of the year`
    default:
      return `${d} of every month`
  }
}

export function DonorDashboard({ data: initialData }: DonorDashboardProps) {
  const [data, setData] = useState(initialData)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [updating, setUpdating] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const { donor, pledge, donations, categories } = data

  const cumulativeTotal = donations
    .filter((d) => d.status === 'RECEIVED')
    .reduce((sum, d) => sum + d.amount, 0)

  const receivedCount = donations.filter((d) => d.status === 'RECEIVED').length

  // Find the next pending donation for PayNow QR
  const pendingDonation = donations.find((d) => d.status === 'PENDING')

  async function handlePledgeAction(action: ConfirmAction) {
    if (!pledge || !action) return

    const statusMap: Record<string, string> = {
      pause: 'PAUSED',
      cancel: 'CANCELLED',
      resume: 'ACTIVE',
    }

    setUpdating(true)
    setSuccessMessage(null)

    try {
      const res = await fetch(`/api/pledges/${pledge.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusMap[action] }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update')
      }

      const updatedPledge = await res.json()

      setData((prev) => ({
        ...prev,
        pledge: updatedPledge,
      }))

      const messages: Record<string, string> = {
        pause: 'Your pledge has been paused. You can resume anytime.',
        cancel: 'Your pledge has been cancelled.',
        resume: 'Your pledge has been resumed. Welcome back!',
      }
      setSuccessMessage(messages[action])
    } catch (error) {
      console.error('Pledge action error:', error)
      setSuccessMessage(null)
    } finally {
      setUpdating(false)
      setConfirmAction(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-xl font-semibold text-primary-800 dark:text-primary-200">
          Welcome, {donor.name}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{donor.phone}</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-3">
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {/* At-Risk Warning */}
      {pledge && pledge.status === 'ACTIVE' && pledge.missedCount > 0 && (
        <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4">
          <div className="flex gap-3">
            <svg className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                Payment Overdue
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                You have missed {pledge.missedCount} payment{pledge.missedCount > 1 ? 's' : ''}.
                {pledge.graceDeadline && (
                  <> Your account will be suspended after{' '}
                    <span className="font-semibold">
                      {new Date(pledge.graceDeadline).toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    {' '}if payment is not received.
                  </>
                )}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">
                Please make your payment to keep your account active.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Suspended Notice */}
      {pledge && pledge.status === 'PAUSED' && pledge.missedCount > 0 && (
        <div className="rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-4">
          <div className="flex gap-3">
            <svg className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
                Account Suspended
              </h3>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                Your account has been suspended due to missed payments. Please contact the mosque or resume your pledge to reactivate.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* A. Membership Card */}
      {pledge && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Your Pledge</CardTitle>
              <Badge variant={pledgeStatusVariant(pledge.status)}>
                {pledge.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tier</p>
                <p className="text-lg font-semibold text-primary-800 dark:text-primary-200">
                  {tierLabels[pledge.tier] || pledge.tier}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Amount</p>
                <p className="text-lg font-semibold text-primary-800 dark:text-primary-200">
                  {formatCurrency(pledge.amount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Frequency</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {frequencyLabel(pledge.frequency)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Reminder</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {reminderLabel(pledge.reminderDay, pledge.frequency)}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Payment</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {pledge.paymentMethod === 'EGIRO' ? 'eGIRO (Auto-Debit)' : 'PayNow / Bank Transfer'}
                </p>
              </div>
            </div>

            {/* Tier benefits */}
            {tierBenefits[pledge.tier] && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Your Benefits</p>
                <ul className="space-y-1.5">
                  {tierBenefits[pledge.tier].map((benefit) => (
                    <li key={benefit} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <svg className="h-4 w-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap gap-3">
              {pledge.status === 'ACTIVE' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmAction('pause')}
                    disabled={updating}
                  >
                    Pause Pledge
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => setConfirmAction('cancel')}
                    disabled={updating}
                  >
                    Cancel Pledge
                  </Button>
                </>
              )}
              {pledge.status === 'PAUSED' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setConfirmAction('resume')}
                  disabled={updating}
                >
                  Resume Pledge
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!pledge && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">No active pledge found.</p>
            <Link
              href="/pledge"
              className="mt-2 inline-block text-sm font-medium text-primary-700 dark:text-primary-400 hover:underline"
            >
              Start Donating
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <Card className="w-full max-w-sm">
            <CardContent className="py-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {confirmAction === 'pause' && 'Pause your pledge?'}
                {confirmAction === 'cancel' && 'Cancel your pledge?'}
                {confirmAction === 'resume' && 'Resume your pledge?'}
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {confirmAction === 'pause' &&
                  'Your pledge will be paused and reminders will stop. You can resume anytime.'}
                {confirmAction === 'cancel' &&
                  'This action is permanent. Your pledge will be cancelled. You can always start a new one later.'}
                {confirmAction === 'resume' &&
                  'Your pledge will be reactivated and reminders will resume.'}
              </p>
              <div className="mt-6 flex gap-3 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmAction(null)}
                  disabled={updating}
                >
                  Go Back
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className={
                    confirmAction === 'cancel'
                      ? 'bg-red-600 hover:bg-red-700'
                      : ''
                  }
                  onClick={() => handlePledgeAction(confirmAction)}
                  disabled={updating}
                >
                  {updating
                    ? 'Updating...'
                    : confirmAction === 'pause'
                      ? 'Yes, Pause'
                      : confirmAction === 'cancel'
                        ? 'Yes, Cancel'
                        : 'Yes, Resume'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* B. Impact Stats */}
      {pledge && receivedCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Impact</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                <p className="text-2xl font-bold text-primary-800 dark:text-primary-200">
                  {formatCurrency(cumulativeTotal)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Contributed</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-gold-50 dark:bg-gold-900/20">
                <p className="text-2xl font-bold text-gold-700 dark:text-gold-400">
                  {receivedCount}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Months Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* C. PayNow QR for next pending payment (manual only) */}
      {pledge && pledge.status === 'ACTIVE' && pendingDonation && pledge.paymentMethod !== 'EGIRO' && (
        <Card>
          <CardHeader>
            <CardTitle>Next Payment Due</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {formatMonth(pendingDonation.cycleMonth)} — {formatCurrency(pendingDonation.amount)}
            </p>
            <PaymentMethods amount={pendingDonation.amount} reference={pendingDonation.reference} />
          </CardContent>
        </Card>
      )}

      {/* C2. eGIRO status */}
      {pledge && pledge.status === 'ACTIVE' && pledge.paymentMethod === 'EGIRO' && pendingDonation && (
        <Card>
          <CardHeader>
            <CardTitle>eGIRO Auto-Debit</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 p-4">
              <svg className="h-8 w-8 text-primary-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-primary-800 dark:text-primary-200">
                  {formatMonth(pendingDonation.cycleMonth)} — {formatCurrency(pendingDonation.amount)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Your bank will auto-debit this amount. No action needed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* D. Contribution History */}
      <Card>
        <CardHeader>
          <CardTitle>Contribution History</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {donations.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
              No contribution records yet.
            </p>
          ) : (
            <>
              <div className="space-y-3">
                {donations.map((donation) => (
                  <div
                    key={donation.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-700 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatMonth(donation.cycleMonth)}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-gray-400 dark:text-gray-500">
                        {donation.reference}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(donation.amount)}
                      </span>
                      <Badge variant={donationStatusVariant(donation.status)}>
                        {donation.status.toLowerCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cumulative total */}
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Contributed
                </span>
                <span className="text-lg font-bold text-primary-800 dark:text-primary-200">
                  {formatCurrency(cumulativeTotal)}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* E. Share / Invite */}
      <Card>
        <CardContent className="py-6 text-center">
          <h3 className="text-base font-semibold text-primary-800 dark:text-primary-200">
            Know someone who&apos;d like to donate?
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Share Skim Pintar with friends and family
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
              const url = `${window.location.origin}/pledge`
              if (navigator.share) {
                navigator.share({ title: 'Skim Pintar — Masjid Ar-Raudhah', url })
              } else {
                navigator.clipboard.writeText(url)
              }
            }}
          >
            Share Donation Link
          </Button>
        </CardContent>
      </Card>

      {/* F. Transparency Preview */}
      {pledge && categories.length > 0 && (
        <TransparencyPreview amount={pledge.amount} categories={categories} />
      )}
    </div>
  )
}
