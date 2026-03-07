import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { generateReference } from '@/lib/paynow-qr'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { QRDisplay } from '@/components/donor/qr-display'

const frequencyLabels: Record<string, string> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  ANNUAL: 'Annual',
}

const channelLabels: Record<string, string> = {
  WHATSAPP: 'WhatsApp',
  SMS: 'SMS',
  EMAIL: 'Email',
}

const dayLabels: Record<number, string> = {
  1: '1st',
  15: '15th',
  25: '25th',
}

interface SuccessPageProps {
  searchParams: Promise<{ donorId?: string; pledgeId?: string }>
}

export default async function PledgeSuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams
  const donorId = params.donorId ? parseInt(params.donorId, 10) : null
  const pledgeId = params.pledgeId ? parseInt(params.pledgeId, 10) : null

  if (!donorId || !pledgeId || isNaN(donorId) || isNaN(pledgeId)) {
    return (
      <main className="min-h-screen bg-warmWhite flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Invalid Link</h1>
          <p className="text-sm text-gray-500">
            This pledge confirmation link is invalid or incomplete. Please try registering again.
          </p>
          <Link href="/pledge">
            <Button variant="primary" size="lg" className="mt-4">
              Start a New Pledge
            </Button>
          </Link>
        </div>
      </main>
    )
  }

  const { data: donor } = await supabase.from('donors').select().eq('id', donorId).single()
  const { data: pledge } = await supabase.from('pledges').select().eq('id', pledgeId).single()

  if (!donor || !pledge || pledge.donor_id !== donorId) {
    return (
      <main className="min-h-screen bg-warmWhite flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Pledge Not Found</h1>
          <p className="text-sm text-gray-500">
            We could not find your pledge details. Please try registering again.
          </p>
          <Link href="/pledge">
            <Button variant="primary" size="lg" className="mt-4">
              Start a New Pledge
            </Button>
          </Link>
        </div>
      </main>
    )
  }

  // Find the first pending donation for this pledge
  const { data: pendingDonation } = await supabase
    .from('donations')
    .select()
    .eq('pledge_id', pledge.id)
    .eq('status', 'PENDING')
    .order('cycle_month')
    .limit(1)
    .maybeSingle()

  const formattedDonorId = `SP-${String(donor.id).padStart(4, '0')}`

  // Generate reference for QR display
  const qrReference = pendingDonation
    ? pendingDonation.reference
    : generateReference(donor.id, new Date().toISOString().slice(0, 7))

  const qrAmount = pendingDonation ? pendingDonation.amount : pledge.amount

  return (
    <main className="min-h-screen bg-warmWhite">
      {/* Header */}
      <div className="bg-primary-800">
        <div className="mx-auto max-w-2xl px-6 py-6 text-center">
          <h1 className="text-xl font-bold text-white sm:text-2xl">
            Pledge Confirmed
          </h1>
          <p className="mt-1 text-sm text-primary-200">
            Masjid Ar-Raudhah Skim Pintar
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-6 py-8 space-y-8">
        {/* Success message */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-primary-800">
            Alhamdulillah! Your Pledge is Confirmed
          </h2>
          <p className="text-sm text-gray-500">
            Your Skim Pintar Donor ID:{' '}
            <span className="font-mono font-semibold text-primary-700">{formattedDonorId}</span>
          </p>
        </div>

        {/* Pledge summary */}
        <Card>
          <CardContent className="py-6">
            <h3 className="text-lg font-semibold text-primary-800 mb-4">
              Pledge Summary
            </h3>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Amount</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {formatCurrency(pledge.amount)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Frequency</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {frequencyLabels[pledge.frequency] || pledge.frequency}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Reminder Day</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {dayLabels[pledge.reminder_day] || `${pledge.reminder_day}th`} of the month
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Reminder Via</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {channelLabels[donor.reminder_channel] || donor.reminder_channel}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* First donation QR */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-primary-800 text-center">
            Make Your First Donation Now
          </h3>
          <QRDisplay amount={qrAmount} reference={qrReference} />
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link href="/my" className="flex-1">
            <Button variant="primary" size="lg" className="w-full">
              View My Dashboard
            </Button>
          </Link>
          <Link href="/" className="flex-1">
            <Button variant="ghost" size="lg" className="w-full">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
