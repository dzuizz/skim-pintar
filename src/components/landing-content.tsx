'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { TransparencyPreview } from '@/components/donor/transparency-preview'
import { LanguageToggle } from '@/components/ui/language-toggle'
import { SiteNav } from '@/components/site-nav'
import { translations, type Locale } from '@/lib/i18n'

interface Category {
  category: string
  percentage: number
  description: string
}

export function LandingContent({ categories }: { categories: Category[] }) {
  const [locale, setLocale] = useState<Locale>('en')
  const t = translations[locale]

  const handleLocaleChange = useCallback((l: Locale) => setLocale(l), [])

  return (
    <main className="flex flex-col min-h-screen">
      <SiteNav />

      {/* ========== Hero Section ========== */}
      <section className="relative bg-primary-800">
        <div className="absolute inset-0 islamic-pattern" />
        <div className="absolute top-4 right-4 z-20">
          <LanguageToggle onChange={handleLocaleChange} />
        </div>
        <div className="relative z-10 mx-auto max-w-3xl px-6 py-24 text-center sm:py-32">
          <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
            {t.hero.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-primary-100 sm:text-lg">
            {t.hero.subtitle}
          </p>
          <div className="mt-8">
            <Link
              href="/pledge"
              className="inline-flex items-center justify-center rounded-lg bg-gold-500 px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-gold-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-800"
            >
              {t.hero.cta}
            </Link>
          </div>
          <p className="mt-4 text-sm text-primary-200">
            {t.hero.tagline}
          </p>
        </div>
      </section>

      {/* ========== How It Works Section ========== */}
      <section className="bg-white dark:bg-gray-800 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-200 sm:text-3xl">
              {t.howItWorks.title}
            </h2>
            <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-gold-500" />
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {/* Step 1 */}
            <Card className="text-center">
              <CardContent className="py-8">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/30">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-primary-700 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-primary-800 dark:text-primary-200">
                  {t.howItWorks.step1.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  {t.howItWorks.step1.desc}
                </p>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="text-center">
              <CardContent className="py-8">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/30">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-primary-700 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 8h6M9 11h3" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-primary-800 dark:text-primary-200">
                  {t.howItWorks.step2.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  {t.howItWorks.step2.desc}
                </p>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="text-center">
              <CardContent className="py-8">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/30">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-primary-700 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-primary-800 dark:text-primary-200">
                  {t.howItWorks.step3.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  {t.howItWorks.step3.desc}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ========== Initiatives Section ========== */}
      <section className="bg-warmWhite dark:bg-gray-900 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-200 sm:text-3xl">
              {t.initiatives.title}
            </h2>
            <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-gold-500" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              {t.initiatives.subtitle}
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="py-6">
                <h3 className="font-semibold text-primary-800 dark:text-primary-200">{t.initiatives.youth.title}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {t.initiatives.youth.desc}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-6">
                <h3 className="font-semibold text-primary-800 dark:text-primary-200">{t.initiatives.education.title}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {t.initiatives.education.desc}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-6">
                <h3 className="font-semibold text-primary-800 dark:text-primary-200">{t.initiatives.welfare.title}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {t.initiatives.welfare.desc}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-6">
                <h3 className="font-semibold text-primary-800 dark:text-primary-200">{t.initiatives.dawah.title}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {t.initiatives.dawah.desc}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <a
              href="https://arraudhahmosque.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 hover:underline"
            >
              {t.initiatives.explore}
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* ========== Transparency Section ========== */}
      <section className="bg-cream dark:bg-gray-800 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-200 sm:text-3xl">
              {t.transparency.title}
            </h2>
            <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-gold-500" />
          </div>

          <div className="mt-10">
            <TransparencyPreview amount={50} categories={categories} />
          </div>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {t.transparency.donate}
          </p>
        </div>
      </section>

      {/* ========== Footer ========== */}
      <footer className="bg-primary-900 dark:bg-gray-950 py-10">
        <div className="mx-auto max-w-5xl px-6 text-center text-sm text-white/80">
          <p className="text-base font-semibold text-white">
            {t.footer.mosque}
          </p>
          <p className="mt-1">{t.footer.address}</p>
          <a
            href="https://arraudhahmosque.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-white/70 hover:text-white transition-colors"
          >
            arraudhahmosque.com
          </a>
          <p className="mt-4 text-white/60">
            {t.footer.tagline} &middot; 2026
          </p>
        </div>
      </footer>
    </main>
  )
}
