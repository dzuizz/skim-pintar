import Link from 'next/link'
import { prisma } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { TransparencyPreview } from '@/components/donor/transparency-preview'

export default async function Home() {
  const transparencyData = await prisma.transparencyConfig.findMany({
    orderBy: { sortOrder: 'asc' },
  })

  const categories = transparencyData.map((t) => ({
    category: t.category,
    percentage: t.percentage,
    description: t.description,
  }))

  return (
    <main className="flex flex-col min-h-screen">
      {/* ========== Hero Section ========== */}
      <section className="relative bg-primary-800">
        <div className="absolute inset-0 islamic-pattern" />
        <div className="relative z-10 mx-auto max-w-3xl px-6 py-24 text-center sm:py-32">
          <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
            Support Ar-Raudhah Every Month
          </h1>
          <p className="mt-4 text-base leading-relaxed text-primary-100 sm:text-lg">
            Set up your recurring donation in under 2 minutes. Pay easily via
            PayNow — no forms, no waiting.
          </p>
          <div className="mt-8">
            <Link
              href="/pledge"
              className="inline-flex items-center justify-center rounded-lg bg-gold-500 px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-gold-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-800"
            >
              Start My Pledge
            </Link>
          </div>
          <p className="mt-4 text-sm text-primary-200">
            Join hundreds of donors sustaining our community
          </p>
        </div>
      </section>

      {/* ========== How It Works Section ========== */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-primary-800 sm:text-3xl">
              How It Works
            </h2>
            <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-gold-500" />
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {/* Step 1 — Pledge */}
            <Card className="text-center">
              <CardContent className="py-8">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7 text-primary-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-primary-800">
                  1. Pledge
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  Choose your amount and frequency in under 2 minutes
                </p>
              </CardContent>
            </Card>

            {/* Step 2 — Pay */}
            <Card className="text-center">
              <CardContent className="py-8">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7 text-primary-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 8h6M9 11h3"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-primary-800">
                  2. Pay
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  Scan the PayNow QR code or tap to pay — takes 15 seconds
                </p>
              </CardContent>
            </Card>

            {/* Step 3 — Track */}
            <Card className="text-center">
              <CardContent className="py-8">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7 text-primary-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-primary-800">
                  3. Track
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  See your giving history and where your donations could go
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ========== Transparency Section ========== */}
      <section className="bg-cream py-16 sm:py-20">
        <div className="mx-auto max-w-2xl px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-primary-800 sm:text-3xl">
              See Where Your Donation Goes
            </h2>
            <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-gold-500" />
          </div>

          <div className="mt-10">
            <TransparencyPreview amount={50} categories={categories} />
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            Donate any amount from $10/month
          </p>
        </div>
      </section>

      {/* ========== Footer ========== */}
      <footer className="bg-primary-900 py-10">
        <div className="mx-auto max-w-5xl px-6 text-center text-sm text-white/80">
          <p className="text-base font-semibold text-white">
            Masjid Ar-Raudhah
          </p>
          <p className="mt-1">1 Jln Kuak, Singapore 799316</p>
          <p className="mt-4 text-white/60">
            A Skim Pintar Initiative &middot; 2026
          </p>
        </div>
      </footer>
    </main>
  )
}
