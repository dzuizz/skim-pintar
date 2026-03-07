export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PledgeActions, MarkReceivedButton } from '@/components/admin/donor-actions'
import { QRDisplay } from '@/components/donor/qr-display'

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatMonth(cycleMonth: string): string {
  const [year, month] = cycleMonth.split('-')
  const date = new Date(Number(year), Number(month) - 1)
  return date.toLocaleDateString('en-SG', { month: 'short', year: 'numeric' })
}

function frequencyLabel(frequency: string): string {
  switch (frequency) {
    case 'MONTHLY':
      return 'Monthly'
    case 'QUARTERLY':
      return 'Quarterly'
    case 'ANNUAL':
      return 'Annual'
    default:
      return frequency
  }
}

function reminderDayLabel(day: number): string {
  const suffix =
    day === 1 || day === 21 || day === 31
      ? 'st'
      : day === 2 || day === 22
        ? 'nd'
        : day === 3 || day === 23
          ? 'rd'
          : 'th'
  return `${day}${suffix} of each month`
}

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

function donationStatusVariant(status: string): 'received' | 'pending' | 'missed' {
  switch (status) {
    case 'RECEIVED':
      return 'received'
    case 'PENDING':
      return 'pending'
    case 'MISSED':
      return 'missed'
    default:
      return 'pending'
  }
}

interface DonorDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function AdminDonorDetailPage({ params }: DonorDetailPageProps) {
  const { id } = await params
  const donorId = parseInt(id, 10)

  if (isNaN(donorId)) {
    notFound()
  }

  const donor = await prisma.donor.findUnique({
    where: { id: donorId },
    include: {
      pledges: {
        orderBy: { createdAt: 'desc' },
      },
      donations: {
        orderBy: { cycleMonth: 'desc' },
        include: {
          pledge: {
            select: { amount: true, frequency: true },
          },
        },
      },
    },
  })

  if (!donor) {
    notFound()
  }

  const activePledge = donor.pledges.find((p) => p.status === 'ACTIVE')
  const latestPledge = donor.pledges[0] || null

  // Find current month's pending donation for QR display
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const currentDonation = donor.donations.find(
    (d) => d.cycleMonth === currentMonth && d.status === 'PENDING',
  )

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/admin/donors">
        <Button variant="ghost" size="sm">
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Donors
        </Button>
      </Link>

      {/* Donor Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Donor Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </dt>
              <dd className="mt-1 text-sm text-gray-900 font-medium">{donor.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{donor.phone}</dd>
            </div>
            {donor.email && (
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{donor.email}</dd>
              </div>
            )}
            {donor.nricLast4 && (
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NRIC (last 4)
                </dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">
                  ****{donor.nricLast4}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reminder Channel
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{donor.reminderChannel}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(donor.createdAt)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Active / Latest Pledge Card */}
      {latestPledge && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {activePledge ? 'Active Pledge' : 'Latest Pledge'}
            </CardTitle>
            <Badge variant={statusBadgeVariant(latestPledge.status)}>
              {latestPledge.status}
            </Badge>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4 mb-6">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </dt>
                <dd className="mt-1 text-lg font-semibold text-primary-800">
                  {formatCurrency(latestPledge.amount)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Frequency
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {frequencyLabel(latestPledge.frequency)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reminder Day
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {reminderDayLabel(latestPledge.reminderDay)}
                </dd>
              </div>
            </dl>
            <PledgeActions
              pledgeId={latestPledge.id}
              currentStatus={latestPledge.status}
            />
          </CardContent>
        </Card>
      )}

      {!latestPledge && (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-sm text-gray-500">
              This donor has not made any pledges yet.
            </p>
          </CardContent>
        </Card>
      )}

      {/* PayNow QR for Current Month */}
      {currentDonation && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Current Month Payment
          </h3>
          <QRDisplay
            amount={currentDonation.amount}
            reference={currentDonation.reference}
          />
        </div>
      )}

      {/* Donation History */}
      <Card>
        <CardHeader>
          <CardTitle>Donation History</CardTitle>
        </CardHeader>
        <CardContent>
          {donor.donations.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-4">
              No donation records yet.
            </p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Month
                      </th>
                      <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reference
                      </th>
                      <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {donor.donations.map((donation) => (
                      <tr key={donation.id}>
                        <td className="py-3 text-sm text-gray-900">
                          {formatMonth(donation.cycleMonth)}
                        </td>
                        <td className="py-3 text-sm text-gray-900 font-medium">
                          {formatCurrency(donation.amount)}
                        </td>
                        <td className="py-3">
                          <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">
                            {donation.reference}
                          </code>
                        </td>
                        <td className="py-3">
                          <Badge variant={donationStatusVariant(donation.status)}>
                            {donation.status}
                          </Badge>
                        </td>
                        <td className="py-3">
                          {donation.status === 'PENDING' && (
                            <MarkReceivedButton donationId={donation.id} />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {donor.donations.map((donation) => (
                  <div
                    key={donation.id}
                    className="border border-gray-100 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {formatMonth(donation.cycleMonth)}
                      </span>
                      <Badge variant={donationStatusVariant(donation.status)}>
                        {donation.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-800 font-medium">
                        {formatCurrency(donation.amount)}
                      </span>
                      <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">
                        {donation.reference}
                      </code>
                    </div>
                    {donation.status === 'PENDING' && (
                      <div className="mt-3 pt-3 border-t border-gray-50">
                        <MarkReceivedButton donationId={donation.id} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
