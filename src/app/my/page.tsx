'use client'

import { useState } from 'react'
import { SiteNav } from '@/components/site-nav'
import { DonorLogin, type DonorData } from '@/components/donor/donor-login'
import { DonorDashboard } from '@/components/donor/donor-dashboard'

export default function MyPage() {
  const [donorData, setDonorData] = useState<DonorData | null>(null)

  return (
    <main className="min-h-screen bg-warmWhite dark:bg-gray-900">
      <SiteNav />

      {/* Content — wider for dashboard, narrow for login */}
      <div className={`mx-auto px-6 py-8 ${donorData ? 'max-w-5xl' : 'max-w-2xl'}`}>
        {donorData ? (
          <DonorDashboard data={donorData} />
        ) : (
          <DonorLogin onLogin={setDonorData} />
        )}
      </div>
    </main>
  )
}
