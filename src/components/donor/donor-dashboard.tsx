'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge, type BadgeVariant } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TransparencyPreview } from '@/components/donor/transparency-preview'
import { PaymentMethods } from '@/components/donor/payment-methods'
import { ProfileEditor } from '@/components/donor/profile-editor'
import { DependantsList } from '@/components/donor/dependants-list'
import { formatCurrency } from '@/lib/utils'
import { useLocale } from '@/lib/use-locale'
import type { DonorData } from '@/components/donor/donor-login'

interface DonorDashboardProps {
  data: DonorData
}

type ConfirmAction = 'pause' | 'cancel' | 'resume' | 'reactivate' | 'tierChange' | null

const tierBenefits: Record<string, string[]> = {
  INDIVIDUAL: ['Community donor benefits', 'Funeral coverage (Khidmat Jenazah)', '20% course discount'],
  FAMILY: ['Family funeral coverage', '50% course discount', 'All Individual benefits'],
  CUSTOM: ['All Individual benefits', 'Flexible donation amount'],
}

const tierAmounts: Record<string, number> = {
  INDIVIDUAL: 5,
  FAMILY: 20,
  CUSTOM: 10,
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
  const [selectedTier, setSelectedTier] = useState<string | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const t = useLocale()

  const tierLabels: Record<string, string> = {
    INDIVIDUAL: t.pledge.tierIndividual,
    FAMILY: t.pledge.tierFamily,
    CUSTOM: t.pledge.tierCustom,
  }

  function frequencyLabel(freq: string): string {
    switch (freq) {
      case 'MONTHLY': return t.dashboard.monthly
      case 'QUARTERLY': return t.dashboard.quarterly
      case 'ANNUAL': return t.dashboard.annual
      default: return freq
    }
  }

  const { donor, pledge, donations, categories } = data

  const cumulativeTotal = donations
    .filter((d) => d.status === 'RECEIVED')
    .reduce((sum, d) => sum + d.amount, 0)

  const receivedCount = donations.filter((d) => d.status === 'RECEIVED').length
  const pendingDonation = donations.find((d) => d.status === 'PENDING')

  async function handlePledgeAction(action: ConfirmAction) {
    if (!pledge || !action) return

    setUpdating(true)
    setSuccessMessage(null)

    try {
      let res: Response

      if (action === 'reactivate') {
        res = await fetch(`/api/pledges/${pledge.id}/reactivate`, { method: 'POST' })
      } else if (action === 'tierChange' && selectedTier) {
        const amount = selectedTier === 'CUSTOM'
          ? (parseFloat(customAmount) || 0)
          : tierAmounts[selectedTier]
        if (amount <= 0) return
        res = await fetch(`/api/pledges/${pledge.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier: selectedTier, amount }),
        })
      } else {
        const statusMap: Record<string, string> = {
          pause: 'PAUSED',
          cancel: 'CANCELLED',
          resume: 'ACTIVE',
        }
        res = await fetch(`/api/pledges/${pledge.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: statusMap[action] }),
        })
      }

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
        pause: t.dashboard.pauseSuccess,
        cancel: t.dashboard.cancelSuccess,
        resume: t.dashboard.resumeSuccess,
        reactivate: t.dashboard.reactivateSuccess,
        tierChange: t.dashboard.tierChangeSuccess,
      }
      setSuccessMessage(messages[action])
      setSelectedTier(null)
      setCustomAmount('')
    } catch (error) {
      console.error('Pledge action error:', error)
      setSuccessMessage(null)
    } finally {
      setUpdating(false)
      setConfirmAction(null)
    }
  }

  function openTierChange(newTier: string) {
    setSelectedTier(newTier)
    setConfirmAction('tierChange')
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-xl font-semibold text-primary-800 dark:text-primary-200">
          {t.dashboard.welcome} {donor.name}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{donor.phone}</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="rounded border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 p-3">
          <p className="text-sm text-primary-700 dark:text-primary-400">{successMessage}</p>
        </div>
      )}

      {/* At-Risk Warning */}
      {pledge && pledge.status === 'ACTIVE' && pledge.missedCount > 0 && (
        <div className="rounded border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4">
          <div className="flex gap-3">
            <svg className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                {t.dashboard.paymentOverdue}
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                {t.dashboard.missedPayments.replace('{count}', String(pledge.missedCount))}
                {pledge.graceDeadline && (() => {
                  const daysLeft = Math.ceil((new Date(pledge.graceDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  return daysLeft > 0 ? (
                    <> {t.dashboard.daysLeft.replace('{days}', String(daysLeft))}</>
                  ) : (
                    <> {t.dashboard.graceExpired}</>
                  )
                })()}
              </p>
              {pendingDonation && (
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-3"
                  onClick={() => document.getElementById('payment-section')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  {t.dashboard.payNow}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Suspended / Cancelled Notice */}
      {pledge && (pledge.status === 'PAUSED' || pledge.status === 'CANCELLED') && (
        <div className="rounded border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-4">
          <div className="flex gap-3">
            <svg className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
                {pledge.status === 'CANCELLED' ? t.dashboard.membershipCancelled : t.dashboard.accountSuspended}
              </h3>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                {pledge.status === 'CANCELLED'
                  ? t.dashboard.cancelledDesc
                  : t.dashboard.suspendedDesc}
              </p>
              <Button
                variant="primary"
                size="sm"
                className="mt-3"
                onClick={() => setConfirmAction('reactivate')}
                disabled={updating}
              >
                {t.dashboard.reactivate}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Two-column layout on desktop */}
      <div className="lg:grid lg:grid-cols-3 lg:gap-6">
        {/* Left column (main content) */}
        <div className="lg:col-span-2 space-y-6">
          {/* A. Membership Card */}
          {pledge && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t.dashboard.yourPledge}</CardTitle>
                  <Badge variant={pledgeStatusVariant(pledge.status)}>
                    {pledge.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t.dashboard.tier}</p>
                    <p className="text-lg font-semibold text-primary-800 dark:text-primary-200">
                      {tierLabels[pledge.tier] || pledge.tier}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t.dashboard.amount}</p>
                    <p className="text-lg font-semibold text-primary-800 dark:text-primary-200">
                      {formatCurrency(pledge.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t.dashboard.frequency}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {frequencyLabel(pledge.frequency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t.dashboard.reminder}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {reminderLabel(pledge.reminderDay, pledge.frequency)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t.dashboard.payment}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {pledge.paymentMethod === 'EGIRO' ? t.dashboard.egiroPayment : t.dashboard.manualPayment}
                    </p>
                  </div>
                </div>

                {/* Tier benefits */}
                {tierBenefits[pledge.tier] && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{t.dashboard.yourBenefits}</p>
                    <ul className="space-y-1.5">
                      {tierBenefits[pledge.tier].map((benefit) => (
                        <li key={benefit} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <svg className="h-4 w-4 text-primary-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tier Change */}
                {pledge.status === 'ACTIVE' && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{t.dashboard.changeTier}</p>
                    <div className="flex flex-wrap gap-2">
                      {(['INDIVIDUAL', 'FAMILY', 'CUSTOM'] as const).filter(t => t !== pledge.tier).map((tier) => (
                        <button
                          key={tier}
                          onClick={() => openTierChange(tier)}
                          className="px-3 py-1.5 rounded text-xs font-medium border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary-400 hover:text-primary-700 dark:hover:text-primary-400 transition-colors"
                        >
                          {tier === 'CUSTOM'
                            ? `${tierLabels[tier]} — ${t.pledge.tierCustomTagline}`
                            : `${tierLabels[tier]} — ${formatCurrency(tierAmounts[tier])}/mo`}
                        </button>
                      ))}
                    </div>
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
                        {t.dashboard.pausePledge}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => setConfirmAction('cancel')}
                        disabled={updating}
                      >
                        {t.dashboard.cancelPledge}
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
                      {t.dashboard.resumePledge}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {!pledge && (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">{t.dashboard.noPledge}</p>
                <Link
                  href="/pledge"
                  className="mt-2 inline-block text-sm font-medium text-primary-700 dark:text-primary-400 hover:underline"
                >
                  {t.dashboard.startDonating}
                </Link>
              </CardContent>
            </Card>
          )}

          {/* PayNow QR */}
          {pledge && pledge.status === 'ACTIVE' && pendingDonation && pledge.paymentMethod !== 'EGIRO' && (
            <Card id="payment-section">
              <CardHeader>
                <CardTitle>{t.dashboard.nextPayment}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {formatMonth(pendingDonation.cycleMonth)} — {formatCurrency(pendingDonation.amount)}
                </p>
                <PaymentMethods amount={pendingDonation.amount} reference={pendingDonation.reference} />
              </CardContent>
            </Card>
          )}

          {/* eGIRO status */}
          {pledge && pledge.status === 'ACTIVE' && pledge.paymentMethod === 'EGIRO' && pendingDonation && (
            <Card>
              <CardHeader>
                <CardTitle>{t.dashboard.egiroAutoDebit}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-3 rounded bg-primary-50 dark:bg-primary-900/20 p-4">
                  <svg className="h-8 w-8 text-primary-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-primary-800 dark:text-primary-200">
                      {formatMonth(pendingDonation.cycleMonth)} — {formatCurrency(pendingDonation.amount)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {t.dashboard.egiroDesc}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contribution History */}
          <Card>
            <CardHeader>
              <CardTitle>{t.dashboard.contributionHistory}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {donations.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
                  {t.dashboard.noRecords}
                </p>
              ) : (
                <>
                  {/* Table view on desktop, card view on mobile */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-700">
                          <th className="text-left py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Month</th>
                          <th className="text-left py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Reference</th>
                          <th className="text-right py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t.dashboard.amount}</th>
                          <th className="text-right py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {donations.map((donation) => (
                          <tr key={donation.id} className="border-b border-gray-50 dark:border-gray-800">
                            <td className="py-2.5 text-gray-900 dark:text-gray-100 font-medium">{formatMonth(donation.cycleMonth)}</td>
                            <td className="py-2.5 font-mono text-xs text-gray-400 dark:text-gray-500">{donation.reference}</td>
                            <td className="py-2.5 text-right font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(donation.amount)}</td>
                            <td className="py-2.5 text-right">
                              <Badge variant={donationStatusVariant(donation.status)}>
                                {donation.status.toLowerCase()}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Mobile card view */}
                  <div className="sm:hidden space-y-3">
                    {donations.map((donation) => (
                      <div
                        key={donation.id}
                        className="flex items-center justify-between rounded border border-gray-100 dark:border-gray-700 p-3"
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
                      {t.dashboard.totalContributed}
                    </span>
                    <span className="text-lg font-bold text-primary-800 dark:text-primary-200">
                      {formatCurrency(cumulativeTotal)}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column (sidebar on desktop) */}
        <div className="mt-6 lg:mt-0 space-y-6">
          {/* Impact Stats */}
          {pledge && receivedCount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t.dashboard.yourImpact}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="text-center p-4 rounded bg-primary-50 dark:bg-primary-900/20">
                    <p className="text-2xl font-bold text-primary-800 dark:text-primary-200">
                      {formatCurrency(cumulativeTotal)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.dashboard.totalContributed}</p>
                  </div>
                  <div className="text-center p-4 rounded bg-gold-50 dark:bg-gold-900/20">
                    <p className="text-2xl font-bold text-gold-700 dark:text-gold-400">
                      {receivedCount}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.dashboard.monthsActive}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Profile Editor */}
          <ProfileEditor
            donor={{
              id: donor.id,
              name: donor.name,
              email: donor.email,
              reminderChannel: donor.reminderChannel,
            }}
            onUpdate={(updated) => {
              setData((prev) => ({
                ...prev,
                donor: { ...prev.donor, ...updated },
              }))
            }}
          />

          {/* Dependants */}
          {pledge && (
            <DependantsList donorId={donor.id} tier={pledge.tier} />
          )}

          {/* Share / Invite */}
          <Card>
            <CardContent className="py-6 text-center">
              <h3 className="text-base font-semibold text-primary-800 dark:text-primary-200">
                {t.dashboard.shareTitle}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t.dashboard.shareDesc}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={async () => {
                  const url = `${window.location.origin}/pledge`
                  if (navigator.share) {
                    try {
                      await navigator.share({ title: 'Skim Pintar — Masjid Ar-Raudhah', url })
                    } catch {
                      // User cancelled share dialog — not an error
                    }
                  } else {
                    navigator.clipboard.writeText(url)
                  }
                }}
              >
                {t.dashboard.shareLink}
              </Button>
            </CardContent>
          </Card>

          {/* Transparency Preview */}
          {pledge && categories.length > 0 && (
            <TransparencyPreview amount={pledge.amount} categories={categories} />
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <Card className="w-full max-w-sm">
            <CardContent className="py-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {confirmAction === 'pause' && t.dashboard.pauseConfirm}
                {confirmAction === 'cancel' && t.dashboard.cancelConfirm}
                {confirmAction === 'resume' && t.dashboard.resumeConfirm}
                {confirmAction === 'reactivate' && t.dashboard.reactivateConfirm}
                {confirmAction === 'tierChange' && t.dashboard.tierChangeConfirm}
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {confirmAction === 'pause' && t.dashboard.pauseDesc}
                {confirmAction === 'cancel' && t.dashboard.cancelDesc}
                {confirmAction === 'resume' && t.dashboard.resumeDesc}
                {confirmAction === 'reactivate' && t.dashboard.reactivateDesc}
                {confirmAction === 'tierChange' && selectedTier && (
                  <>
                    {t.dashboard.tierChangeDesc}
                    {selectedTier === 'CUSTOM' ? (
                      <span className="block mt-3">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t.pledge.customAmountLabel}
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-500">$</span>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            placeholder="e.g. 15"
                            value={customAmount}
                            onChange={(e) => setCustomAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:outline-none"
                          />
                          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">/mo</span>
                        </div>
                        <span className="block mt-2 text-xs text-gray-500 dark:text-gray-400">
                          {tierLabels[pledge?.tier || '']} ({formatCurrency(pledge?.amount || 0)}) → {tierLabels[selectedTier]} ({customAmount ? formatCurrency(parseFloat(customAmount) || 0) : '...'})
                        </span>
                      </span>
                    ) : (
                      <span className="block mt-2 font-medium text-gray-900 dark:text-gray-100">
                        {tierLabels[pledge?.tier || '']} ({formatCurrency(pledge?.amount || 0)}) → {tierLabels[selectedTier]} ({formatCurrency(tierAmounts[selectedTier])})
                      </span>
                    )}
                  </>
                )}
              </p>
              <div className="mt-6 flex gap-3 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setConfirmAction(null); setSelectedTier(null); setCustomAmount('') }}
                  disabled={updating}
                >
                  {t.dashboard.goBack}
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
                  disabled={updating || (confirmAction === 'tierChange' && selectedTier === 'CUSTOM' && (parseFloat(customAmount) || 0) <= 0)}
                >
                  {updating
                    ? t.dashboard.updating
                    : confirmAction === 'pause'
                      ? t.dashboard.yesPause
                      : confirmAction === 'cancel'
                        ? t.dashboard.yesCancel
                        : confirmAction === 'reactivate'
                          ? t.dashboard.yesReactivate
                          : confirmAction === 'tierChange'
                            ? t.dashboard.yesTierChange
                            : t.dashboard.yesResume}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
