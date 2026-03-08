'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { SiteNav } from '@/components/site-nav'
import { DonorLogin, type DonorData } from '@/components/donor/donor-login'
import { DonorDashboard } from '@/components/donor/donor-dashboard'

function MyPageContent() {
  const [donorData, setDonorData] = useState<DonorData | null>(null)
  const searchParams = useSearchParams()
  const initialPhone = searchParams.get('phone') ?? ''

  return (
    <div className={`mx-auto px-6 py-8 ${donorData ? 'max-w-5xl' : 'max-w-2xl'}`}>
      {donorData ? (
        <DonorDashboard data={donorData} />
      ) : (
        <DonorLogin onLogin={setDonorData} initialPhone={initialPhone} />
      )}
    </div>
  )
}

export default function MyPage() {
  return (
    <main className="min-h-screen bg-warmWhite dark:bg-gray-900">
      <SiteNav />
      <Suspense fallback={<div className="mx-auto max-w-2xl px-6 py-8" />}>
        <MyPageContent />
      </Suspense>
    </main>
  )
}
