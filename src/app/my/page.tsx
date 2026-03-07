'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DonorLogin, type DonorData } from '@/components/donor/donor-login'
import { DonorDashboard } from '@/components/donor/donor-dashboard'

export default function MyPage() {
  const [donorData, setDonorData] = useState<DonorData | null>(null)

  return (
    <main className="min-h-screen bg-warmWhite">
      {/* Header */}
      <div className="bg-primary-800">
        <div className="mx-auto max-w-2xl px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white sm:text-2xl">
                Skim Pintar
              </h1>
              <p className="mt-0.5 text-sm text-primary-200">
                Masjid Ar-Raudhah
              </p>
            </div>
            <Link
              href="/"
              className="text-sm font-medium text-primary-200 hover:text-white transition-colors"
            >
              Home
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-2xl px-6 py-8">
        {donorData ? (
          <DonorDashboard data={donorData} />
        ) : (
          <DonorLogin onLogin={setDonorData} />
        )}
      </div>
    </main>
  )
}
