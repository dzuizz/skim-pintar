'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge, type BadgeVariant } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TransparencyPreview } from '@/components/donor/transparency-preview'
import { formatCurrency } from '@/lib/utils'
import type { DonorData } from '@/components/donor/donor-login'

interface DonorDashboardProps {
  data: DonorData
}

type ConfirmAction = 'pause' | 'cancel' | 'resume' | null

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
        throw new Error(err.error || 'Failed to update pledge')
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
        <h2 className="text-xl font-semibold text-primary-800">
          Welcome, {donor.name}
        </h2>
        <p className="text-sm text-gray-500 mt-1">{donor.phone}</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3">
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {/* A. Pledge Card */}
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
                <p className="text-xs text-gray-500 uppercase tracking-wide">Amount</p>
                <p className="text-lg font-semibold text-primary-800">
                  {formatCurrency(pledge.amount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Frequency</p>
                <p className="text-sm font-medium text-gray-900">
                  {frequencyLabel(pledge.frequency)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Reminder Day</p>
                <p className="text-sm font-medium text-gray-900">
                  {reminderLabel(pledge.reminderDay, pledge.frequency)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Reminder Via</p>
                <p className="text-sm font-medium text-gray-900">
                  {channelLabel(donor.reminderChannel)}
                </p>
              </div>
            </div>

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
            <p className="text-gray-500">No pledge found.</p>
            <a
              href="/pledge"
              className="mt-2 inline-block text-sm font-medium text-primary-700 hover:underline"
            >
              Start a new pledge
            </a>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <Card className="w-full max-w-sm">
            <CardContent className="py-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {confirmAction === 'pause' && 'Pause your pledge?'}
                {confirmAction === 'cancel' && 'Cancel your pledge?'}
                {confirmAction === 'resume' && 'Resume your pledge?'}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {confirmAction === 'pause' &&
                  'Your pledge will be paused and reminders will stop. You can resume anytime.'}
                {confirmAction === 'cancel' &&
                  'This action is permanent. Your pledge will be cancelled and cannot be undone. You can always start a new pledge later.'}
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
                  variant={confirmAction === 'cancel' ? 'primary' : 'primary'}
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

      {/* B. Giving History */}
      <Card>
        <CardHeader>
          <CardTitle>Giving History</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {donations.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              No donation records yet.
            </p>
          ) : (
            <>
              {/* Mobile-friendly card list */}
              <div className="space-y-3">
                {donations.map((donation) => (
                  <div
                    key={donation.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {formatMonth(donation.cycleMonth)}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-gray-400">
                        {donation.reference}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-sm font-semibold text-gray-900">
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
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Total Donated
                </span>
                <span className="text-lg font-bold text-primary-800">
                  {formatCurrency(cumulativeTotal)}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* C. Transparency Preview */}
      {pledge && categories.length > 0 && (
        <TransparencyPreview amount={pledge.amount} categories={categories} />
      )}
    </div>
  )
}
