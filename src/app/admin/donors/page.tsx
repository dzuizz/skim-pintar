export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { DonorFilters } from '@/components/admin/donor-filters'

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function frequencyLabel(frequency: string): string {
  switch (frequency) {
    case 'MONTHLY':
      return '/month'
    case 'QUARTERLY':
      return '/quarter'
    case 'ANNUAL':
      return '/year'
    default:
      return ''
  }
}

type PledgeStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED'

function statusBadgeVariant(status: string): 'active' | 'paused' | 'cancelled' {
  switch (status) {
    case 'ACTIVE':
      return 'active'
    case 'PAUSED':
      return 'paused'
    case 'CANCELLED':
      return 'cancelled'
    default:
      return 'paused'
  }
}

interface DonorsPageProps {
  searchParams: Promise<{ search?: string; status?: string }>
}

export default async function AdminDonorsPage({ searchParams }: DonorsPageProps) {
  const { search, status } = await searchParams

  let query = supabase
    .from('donors')
    .select('*, pledges(*)')
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  const { data, error } = await query

  if (error) throw error

  let donors = data ?? []

  // Filter by pledge status in JS
  if (status) {
    donors = donors.filter((d) =>
      d.pledges?.some((p: { status: string }) => p.status === status),
    )
  }

  // Trim pledges to only the most recent one
  donors = donors.map((d) => ({
    ...d,
    pledges: d.pledges
      ?.sort((a: { created_at: string }, b: { created_at: string }) =>
        b.created_at.localeCompare(a.created_at),
      )
      .slice(0, 1),
  }))

  const totalCount = donors.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">All Donors</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {totalCount} donor{totalCount !== 1 ? 's' : ''} found
          </p>
        </div>
      </div>

      {/* Filters */}
      <DonorFilters />

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Pledge
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {donors.map((donor) => {
                  const pledge = donor.pledges[0] || null
                  return (
                    <tr
                      key={donor.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/donors/${donor.id}`}
                          className="text-sm font-medium text-primary-700 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 hover:underline"
                        >
                          {donor.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {donor.phone}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-200">
                        {pledge
                          ? `${formatCurrency(pledge.amount)}${frequencyLabel(pledge.frequency)}`
                          : '-'}
                      </td>
                      <td className="px-6 py-4">
                        {pledge ? (
                          <Badge variant={statusBadgeVariant(pledge.status as PledgeStatus)}>
                            {pledge.status}
                          </Badge>
                        ) : (
                          <Badge variant="paused">No Pledge</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(donor.created_at)}
                      </td>
                    </tr>
                  )
                })}
                {donors.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <p className="text-sm text-gray-500">No donors found</p>
                      {search && (
                        <p className="text-xs text-gray-400 mt-1">
                          Try adjusting your search or filters
                        </p>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden space-y-3">
        {donors.map((donor) => {
          const pledge = donor.pledges[0] || null
          return (
            <Link key={donor.id} href={`/admin/donors/${donor.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-primary-700 dark:text-primary-400 truncate">
                        {donor.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {donor.phone}
                      </p>
                    </div>
                    {pledge ? (
                      <Badge variant={statusBadgeVariant(pledge.status as PledgeStatus)}>
                        {pledge.status}
                      </Badge>
                    ) : (
                      <Badge variant="paused">No Pledge</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {pledge
                        ? `${formatCurrency(pledge.amount)}${frequencyLabel(pledge.frequency)}`
                        : 'No active pledge'}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {formatDate(donor.created_at)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
        {donors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">No donors found</p>
            {search && (
              <p className="text-xs text-gray-400 mt-1">
                Try adjusting your search or filters
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
