'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'

interface Donation {
  id: number
  donor_name: string
  amount: number
  reference: string
  cycle_month: string
  status: 'PENDING' | 'RECEIVED' | 'MISSED'
}

export default function SimulatePage() {
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>('')

  const fetchDonations = useCallback(async (month?: string) => {
    setLoading(true)
    try {
      // Fetch past 6 months + 6 months ahead (to cover simulated future months)
      const months: string[] = []
      const now = new Date()
      for (let i = -6; i < 7; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
      }

      const allDonations: Donation[] = []
      const allMonths = new Set<string>()

      await Promise.all(
        months.map(async (m) => {
          const res = await fetch(`/api/donations?month=${m}`)
          if (res.ok) {
            const data = await res.json()
            for (const d of data) {
              allMonths.add(d.cycle_month)
              allDonations.push({
                id: d.id,
                donor_name: (d.donors as { name: string })?.name ?? '',
                amount: Number(d.amount),
                reference: d.reference,
                cycle_month: d.cycle_month,
                status: d.status,
              })
            }
          }
        }),
      )

      setDonations(allDonations)

      if (!month) {
        const sorted = [...allMonths].sort().reverse()
        if (sorted.length > 0) setSelectedMonth(sorted[0])
      } else {
        setSelectedMonth(month)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDonations()
  }, [fetchDonations])

  async function handleSimulate(action: string, donationId?: number) {
    setActionLoading(action + (donationId || ''))
    setMessage(null)

    try {
      const res = await fetch('/api/admin/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, donationId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error })
        return
      }

      if (action === 'advance-month') {
        const parts = [`${data.created} donation(s) created`]
        if (data.egiroAutoReceived > 0) parts.push(`${data.egiroAutoReceived} eGIRO auto-received`)
        if (data.manualPending > 0) parts.push(`${data.manualPending} manual pending`)
        if (data.suspended > 0) parts.push(`${data.suspended} account(s) suspended`)
        if (data.notificationsSent > 0) parts.push(`${data.notificationsSent} notification(s) sent`)
        setMessage({ type: 'success', text: `${data.message} — ${parts.join(', ')}` })
        setSelectedMonth(data.cycleMonth)
      } else {
        setMessage({ type: 'success', text: `Donation updated to ${action.replace('-', ' ').toUpperCase()}` })
      }

      // Refresh
      await fetchDonations(action === 'advance-month' ? undefined : selectedMonth)
    } catch {
      setMessage({ type: 'error', text: 'Network error' })
    } finally {
      setActionLoading(null)
    }
  }

  // Group by month
  const months = [...new Set(donations.map((d) => d.cycle_month))].sort().reverse()

  const filteredDonations = selectedMonth
    ? donations.filter((d) => d.cycle_month === selectedMonth)
    : donations

  function formatMonth(cycleMonth: string): string {
    const [year, month] = cycleMonth.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('en-SG', { month: 'long', year: 'numeric' })
  }

  function statusVariant(status: string) {
    switch (status) {
      case 'RECEIVED': return 'received' as const
      case 'MISSED': return 'missed' as const
      default: return 'pending' as const
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          MVP Simulation
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Simulate time progression and payment events for demo purposes
        </p>
      </div>

      {/* Status message */}
      {message && (
        <div
          className={`rounded border p-3 ${
            message.type === 'success'
              ? 'border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
              : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
          }`}
        >
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {/* Action Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Advance Month</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Generate next month&apos;s donation records for all active pledges.
              Previous PENDING donations will be marked as MISSED. Donors with missed
              payments get a 1-month grace period with notifications. After grace expires,
              accounts are suspended.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleSimulate('advance-month')}
              disabled={actionLoading !== null}
            >
              {actionLoading === 'advance-month' ? 'Processing...' : 'Advance +1 Month'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current State</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {filteredDonations.filter((d) => d.status === 'PENDING').length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-600">
                  {filteredDonations.filter((d) => d.status === 'RECEIVED').length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Received</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {filteredDonations.filter((d) => d.status === 'MISSED').length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Missed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Month Selector */}
      {months.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {months.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMonth(m)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                selectedMonth === m
                  ? 'bg-primary-700 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {formatMonth(m)}
            </button>
          ))}
        </div>
      )}

      {/* Donations List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedMonth ? formatMonth(selectedMonth) : 'All'} Donations
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">Loading...</p>
          ) : filteredDonations.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
              No donations found. Use &quot;Advance Month&quot; to generate records.
            </p>
          ) : (
            <div className="space-y-3">
              {filteredDonations.map((donation) => (
                <div
                  key={donation.id}
                  className="flex items-center justify-between gap-4 rounded border border-gray-100 dark:border-gray-700 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {donation.donor_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {donation.reference} &middot; {formatCurrency(donation.amount)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={statusVariant(donation.status)}>
                      {donation.status.toLowerCase()}
                    </Badge>

                    {donation.status === 'PENDING' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSimulate('mark-received', donation.id)}
                          disabled={actionLoading !== null}
                          className="text-xs"
                        >
                          {actionLoading === `mark-received${donation.id}` ? '...' : 'Paid'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSimulate('mark-missed', donation.id)}
                          disabled={actionLoading !== null}
                          className="text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          {actionLoading === `mark-missed${donation.id}` ? '...' : 'Miss'}
                        </Button>
                      </>
                    )}

                    {(donation.status === 'RECEIVED' || donation.status === 'MISSED') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSimulate('reset-pending', donation.id)}
                        disabled={actionLoading !== null}
                        className="text-xs"
                      >
                        {actionLoading === `reset-pending${donation.id}` ? '...' : 'Reset'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
