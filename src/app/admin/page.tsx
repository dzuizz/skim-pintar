export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { formatCurrency } from '@/lib/utils'
import { StatCard } from '@/components/admin/stat-card'
import { ActivityList, type ActivityItem } from '@/components/admin/activity-list'

function UsersIcon() {
  return (
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
        d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
      />
    </svg>
  )
}

function DollarIcon() {
  return (
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
        d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  )
}

function ChartIcon() {
  return (
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
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
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
        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  )
}

function formatMonth(cycleMonth: string): string {
  const [year, month] = cycleMonth.split('-')
  const date = new Date(Number(year), Number(month) - 1)
  return date.toLocaleDateString('en-SG', { month: 'short', year: 'numeric' })
}

export default async function AdminDashboardPage() {
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // --- Stats queries ---

  // 1. Active Donors: donors with at least one ACTIVE pledge
  const activeDonorCount = await prisma.donor.count({
    where: {
      pledges: {
        some: { status: 'ACTIVE' },
      },
    },
  })

  // 2. Pledged / Month: sum of amounts from all ACTIVE pledges
  const activePledges = await prisma.pledge.findMany({
    where: { status: 'ACTIVE' },
    select: { amount: true },
  })
  const pledgedPerMonth = activePledges.reduce((sum, p) => sum + p.amount, 0)

  // 3. Fulfilment Rate for current month
  const currentMonthDonations = await prisma.donation.findMany({
    where: { cycleMonth: currentMonth },
    select: { status: true },
  })
  const receivedCount = currentMonthDonations.filter(
    (d) => d.status === 'RECEIVED',
  ).length
  const totalCount = currentMonthDonations.filter(
    (d) => d.status === 'RECEIVED' || d.status === 'PENDING',
  ).length
  const fulfilmentRate =
    totalCount > 0 ? Math.round((receivedCount / totalCount) * 100) : 0

  // 4. Received This Month: sum of amounts for RECEIVED donations in current month
  const receivedDonations = await prisma.donation.findMany({
    where: {
      cycleMonth: currentMonth,
      status: 'RECEIVED',
    },
    select: { amount: true },
  })
  const receivedThisMonth = receivedDonations.reduce(
    (sum, d) => sum + d.amount,
    0,
  )

  // --- Recent Activity ---

  const recentPledges = await prisma.pledge.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      donor: { select: { name: true } },
    },
  })

  const recentReceivedDonations = await prisma.donation.findMany({
    where: { status: 'RECEIVED' },
    orderBy: { receivedAt: 'desc' },
    take: 10,
    include: {
      donor: { select: { name: true } },
    },
  })

  // Combine and sort by date, take last 10
  const activityItems: ActivityItem[] = [
    ...recentPledges.map((p) => ({
      id: `pledge-${p.id}`,
      type: 'pledge' as const,
      description: `${p.donor.name} pledged ${formatCurrency(p.amount)}/month`,
      time: p.createdAt,
    })),
    ...recentReceivedDonations.map((d) => ({
      id: `donation-${d.id}`,
      type: 'donation' as const,
      description: `${d.donor.name} donated ${formatCurrency(d.amount)} for ${formatMonth(d.cycleMonth)}`,
      time: d.receivedAt ?? d.createdAt,
    })),
  ]
    .sort((a, b) => b.time.getTime() - a.time.getTime())
    .slice(0, 10)

  return (
    <div>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<UsersIcon />}
          value={String(activeDonorCount)}
          label="Active Donors"
          accentClass="bg-primary-50 text-primary-700"
        />
        <StatCard
          icon={<DollarIcon />}
          value={formatCurrency(pledgedPerMonth)}
          label="Pledged / Month"
          accentClass="bg-gold-50 text-gold-700"
        />
        <StatCard
          icon={<ChartIcon />}
          value={`${fulfilmentRate}%`}
          label="Fulfilment Rate"
          accentClass="bg-primary-100 text-primary-800"
        />
        <StatCard
          icon={<CheckIcon />}
          value={formatCurrency(receivedThisMonth)}
          label="Received This Month"
          accentClass="bg-gold-100 text-gold-800"
        />
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <ActivityList items={activityItems} />
      </div>
    </div>
  )
}
