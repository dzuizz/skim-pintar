export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { MonthPicker } from '@/components/admin/month-picker'
import { DonationsTable } from '@/components/admin/donations-table'

async function getSimulatedMonth(): Promise<string> {
  const { data } = await supabase
    .from('donations')
    .select('cycle_month')
    .order('cycle_month', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (data?.cycle_month) return data.cycle_month
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

interface PageProps {
  searchParams: Promise<{ month?: string }>
}

export default async function AdminDonationsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const month = params.month && /^\d{4}-\d{2}$/.test(params.month)
    ? params.month
    : await getSimulatedMonth()

  // Fetch all donations for this cycle month
  const { data: donations } = await supabase
    .from('donations')
    .select('*, donors(name)')
    .eq('cycle_month', month)
    .order('created_at', { ascending: false })

  const donationsList = donations ?? []

  // Sort: PENDING first, then RECEIVED, then MISSED
  const statusOrder: Record<string, number> = {
    PENDING: 0,
    RECEIVED: 1,
    MISSED: 2,
  }

  const sorted = donationsList.sort(
    (a, b) => (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3),
  )

  // Compute summary stats
  const received = sorted.filter((d) => d.status === 'RECEIVED')
  const pending = sorted.filter((d) => d.status === 'PENDING')
  const missed = sorted.filter((d) => d.status === 'MISSED')

  const receivedTotal = received.reduce((sum, d) => sum + Number(d.amount), 0)
  const pendingTotal = pending.reduce((sum, d) => sum + Number(d.amount), 0)
  const missedTotal = missed.reduce((sum, d) => sum + Number(d.amount), 0)

  // Transform for client component
  const tableData = sorted.map((d) => ({
    id: d.id,
    donorName: (d.donors as unknown as { name: string })?.name ?? '',
    amount: Number(d.amount),
    reference: d.reference,
    status: d.status as 'PENDING' | 'RECEIVED' | 'MISSED',
    receivedAt: d.received_at ?? null,
  }))

  return (
    <div className="space-y-6">
      {/* Month Picker */}
      <div className="flex items-center justify-between">
        <MonthPicker currentMonth={month} />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Received */}
        <Card>
          <CardContent className="py-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(receivedTotal)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {received.length} Received
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending */}
        <Card>
          <CardContent className="py-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gold-50 text-gold-700">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(pendingTotal)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {pending.length} Pending
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Missed */}
        <Card>
          <CardContent className="py-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-700">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(missedTotal)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {missed.length} Missed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Donations Table */}
      <DonationsTable donations={tableData} />
    </div>
  )
}
