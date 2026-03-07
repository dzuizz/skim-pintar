'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface DonationRow {
  id: number
  donorName: string
  amount: number
  reference: string
  status: 'PENDING' | 'RECEIVED' | 'MISSED'
  receivedAt: string | null
}

interface DonationsTableProps {
  donations: DonationRow[]
}

async function updateDonationStatus(id: number, status: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/donations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    return res.ok
  } catch {
    return false
  }
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function DonationsTable({ donations }: DonationsTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set())

  const pendingDonations = donations.filter((d) => d.status === 'PENDING')
  const hasPending = pendingDonations.length > 0

  const allPendingSelected =
    hasPending && pendingDonations.every((d) => selected.has(d.id))

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function toggleSelectAll() {
    if (allPendingSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(pendingDonations.map((d) => d.id)))
    }
  }

  async function markReceived(id: number) {
    setLoadingIds((prev) => new Set(prev).add(id))
    const ok = await updateDonationStatus(id, 'RECEIVED')
    if (ok) {
      startTransition(() => {
        router.refresh()
      })
    }
    setLoadingIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  async function markSelectedReceived() {
    const ids = Array.from(selected)
    if (ids.length === 0) return

    setLoadingIds(new Set(ids))
    const results = await Promise.all(
      ids.map((id) => updateDonationStatus(id, 'RECEIVED')),
    )

    if (results.some(Boolean)) {
      setSelected(new Set())
      startTransition(() => {
        router.refresh()
      })
    }

    setLoadingIds(new Set())
  }

  if (donations.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
            />
          </svg>
          <p className="mt-4 text-sm text-gray-500">
            No donations found for this month.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Bulk actions */}
      {hasPending && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {selected.size > 0
              ? `${selected.size} selected`
              : `${pendingDonations.length} pending`}
          </p>
          <Button
            variant="primary"
            size="sm"
            disabled={selected.size === 0 || isPending}
            onClick={markSelectedReceived}
          >
            Mark Selected as Received
          </Button>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block">
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  {hasPending && (
                    <th className="px-6 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allPendingSelected}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-primary-700 focus:ring-primary-500"
                        aria-label="Select all pending"
                      />
                    </th>
                  )}
                  <th className="px-6 py-3 font-medium">Donor Name</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Reference</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Received At</th>
                  <th className="px-6 py-3 font-medium w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {donations.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50/50">
                    {hasPending && (
                      <td className="px-6 py-3">
                        {d.status === 'PENDING' ? (
                          <input
                            type="checkbox"
                            checked={selected.has(d.id)}
                            onChange={() => toggleSelect(d.id)}
                            className="rounded border-gray-300 text-primary-700 focus:ring-primary-500"
                            aria-label={`Select ${d.donorName}`}
                          />
                        ) : null}
                      </td>
                    )}
                    <td className="px-6 py-3 font-medium text-gray-900">
                      {d.donorName}
                    </td>
                    <td className="px-6 py-3 text-gray-700">
                      {formatCurrency(d.amount)}
                    </td>
                    <td className="px-6 py-3 text-gray-500 font-mono text-xs">
                      {d.reference}
                    </td>
                    <td className="px-6 py-3">
                      <Badge variant={d.status.toLowerCase() as 'received' | 'pending' | 'missed'}>
                        {d.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-gray-500 text-xs">
                      {formatDateTime(d.receivedAt)}
                    </td>
                    <td className="px-6 py-3">
                      {d.status === 'PENDING' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={loadingIds.has(d.id) || isPending}
                          onClick={() => markReceived(d.id)}
                        >
                          {loadingIds.has(d.id) ? 'Updating...' : 'Mark Received'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {hasPending && (
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={allPendingSelected}
              onChange={toggleSelectAll}
              className="rounded border-gray-300 text-primary-700 focus:ring-primary-500"
            />
            Select all pending
          </label>
        )}

        {donations.map((d) => (
          <Card key={d.id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  {d.status === 'PENDING' && (
                    <input
                      type="checkbox"
                      checked={selected.has(d.id)}
                      onChange={() => toggleSelect(d.id)}
                      className="mt-1 rounded border-gray-300 text-primary-700 focus:ring-primary-500"
                      aria-label={`Select ${d.donorName}`}
                    />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {d.donorName}
                    </p>
                    <p className="text-sm text-gray-500 font-mono mt-0.5">
                      {d.reference}
                    </p>
                  </div>
                </div>
                <Badge variant={d.status.toLowerCase() as 'received' | 'pending' | 'missed'}>
                  {d.status}
                </Badge>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(d.amount)}
                  </p>
                  {d.receivedAt && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDateTime(d.receivedAt)}
                    </p>
                  )}
                </div>
                {d.status === 'PENDING' && (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={loadingIds.has(d.id) || isPending}
                    onClick={() => markReceived(d.id)}
                  >
                    {loadingIds.has(d.id) ? 'Updating...' : 'Mark Received'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
