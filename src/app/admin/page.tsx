export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { StatCard } from '@/components/admin/stat-card'
import { ActivityList, type ActivityItem } from '@/components/admin/activity-list'
import { MonthlyChart } from '@/components/admin/monthly-chart'
import { InitiativeProgress } from '@/components/admin/initiative-progress'

function UsersIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  )
}

function DollarIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function formatMonthLabel(cycleMonth: string): string {
  const [year, month] = cycleMonth.split('-')
  const date = new Date(Number(year), Number(month) - 1)
  return date.toLocaleDateString('en-SG', { month: 'short', year: 'numeric' })
}

function formatMonthShort(cycleMonth: string): string {
  const [year, month] = cycleMonth.split('-')
  const date = new Date(Number(year), Number(month) - 1)
  return date.toLocaleDateString('en-SG', { month: 'short' })
}

// Annual targets for Ar-Raudhah initiatives (SGD)
const INITIATIVE_TARGETS: Record<string, number> = {
  'Mosque Operations & Maintenance': 24000,
  'Religious Education': 18000,
  'Community Welfare & Assistance': 12000,
  'Youth Development': 9600,
  "Da'wah & Outreach": 6000,
}

const INITIATIVE_COLORS: Record<string, string> = {
  'Mosque Operations & Maintenance': 'bg-primary-700',
  'Religious Education': 'bg-gold-500',
  'Community Welfare & Assistance': 'bg-primary-500',
  'Youth Development': 'bg-gold-400',
  "Da'wah & Outreach": 'bg-primary-300',
}

export default async function AdminDashboardPage() {
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // --- Stats queries ---

  // 1. Active Donors
  const { data: activeDonors } = await supabase
    .from('donors')
    .select('id, pledges!inner(status)')
    .eq('pledges.status', 'ACTIVE')

  const activeDonorCount = activeDonors?.length ?? 0

  // 2. Pledged / Month
  const { data: activePledges } = await supabase
    .from('pledges')
    .select('amount')
    .eq('status', 'ACTIVE')

  const pledgedPerMonth = (activePledges ?? []).reduce((sum, p) => sum + Number(p.amount), 0)

  // 3. Current month donations
  const { data: currentMonthDonations } = await supabase
    .from('donations')
    .select('status, amount')
    .eq('cycle_month', currentMonth)

  const receivedCount = (currentMonthDonations ?? []).filter((d) => d.status === 'RECEIVED').length
  const totalCount = (currentMonthDonations ?? []).filter(
    (d) => d.status === 'RECEIVED' || d.status === 'PENDING',
  ).length
  const fulfilmentRate = totalCount > 0 ? Math.round((receivedCount / totalCount) * 100) : 0

  const receivedThisMonth = (currentMonthDonations ?? [])
    .filter((d) => d.status === 'RECEIVED')
    .reduce((sum, d) => sum + Number(d.amount), 0)

  // --- Monthly trend (last 6 months) ---
  const months: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const { data: trendDonations } = await supabase
    .from('donations')
    .select('cycle_month, status, amount')
    .in('cycle_month', months)

  const monthlyData = months.map((m) => {
    const monthDonations = (trendDonations ?? []).filter((d) => d.cycle_month === m)
    return {
      month: m,
      label: formatMonthShort(m),
      received: monthDonations
        .filter((d) => d.status === 'RECEIVED')
        .reduce((sum, d) => sum + Number(d.amount), 0),
      pending: monthDonations
        .filter((d) => d.status === 'PENDING')
        .reduce((sum, d) => sum + Number(d.amount), 0),
    }
  })

  // --- Initiative funding (YTD) ---
  const yearStart = `${now.getFullYear()}-01`
  const { data: ytdDonations } = await supabase
    .from('donations')
    .select('amount, status')
    .eq('status', 'RECEIVED')
    .gte('cycle_month', yearStart)
    .lte('cycle_month', currentMonth)

  const totalReceivedYTD = (ytdDonations ?? []).reduce((sum, d) => sum + Number(d.amount), 0)

  const { data: transparencyConfig } = await supabase
    .from('transparency_config')
    .select('category, percentage')
    .order('sort_order')

  const initiatives = (transparencyConfig ?? []).map((cat) => ({
    name: cat.category,
    allocated: (totalReceivedYTD * cat.percentage) / 100,
    target: INITIATIVE_TARGETS[cat.category] ?? 10000,
    color: INITIATIVE_COLORS[cat.category] ?? 'bg-primary-500',
  }))

  // --- Recent Activity ---
  const { data: recentPledges } = await supabase
    .from('pledges')
    .select('*, donors(name)')
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: recentReceivedDonations } = await supabase
    .from('donations')
    .select('*, donors(name)')
    .eq('status', 'RECEIVED')
    .order('received_at', { ascending: false })
    .limit(10)

  const activityItems: ActivityItem[] = [
    ...(recentPledges ?? []).map((p) => ({
      id: `pledge-${p.id}`,
      type: 'pledge' as const,
      description: `${(p.donors as unknown as { name: string })?.name} pledged ${formatCurrency(Number(p.amount))}/month`,
      time: p.created_at,
    })),
    ...(recentReceivedDonations ?? []).map((d) => ({
      id: `donation-${d.id}`,
      type: 'donation' as const,
      description: `${(d.donors as unknown as { name: string })?.name} donated ${formatCurrency(Number(d.amount))} for ${formatMonthLabel(d.cycle_month)}`,
      time: d.received_at ?? d.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 10)

  return (
    <div className="space-y-6">
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

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MonthlyChart data={monthlyData} />
        <InitiativeProgress initiatives={initiatives} totalReceived={totalReceivedYTD} />
      </div>

      {/* Recent Activity */}
      <ActivityList items={activityItems} />
    </div>
  )
}
