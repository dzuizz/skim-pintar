'use client'

import { useState, useEffect } from 'react'
import type { Locale } from '@/lib/i18n'

export function LanguageToggle() {
  const [locale, setLocale] = useState<Locale>('en')

  useEffect(() => {
    const saved = localStorage.getItem('locale') as Locale | null
    if (saved === 'ms' || saved === 'en') {
      setLocale(saved)
    }
  }, [])

  function toggle() {
    const next: Locale = locale === 'en' ? 'ms' : 'en'
    setLocale(next)
    localStorage.setItem('locale', next)
    window.dispatchEvent(new CustomEvent('locale-change', { detail: next }))
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 rounded bg-white/10 px-2.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
      title={locale === 'en' ? 'Tukar ke Bahasa Melayu' : 'Switch to English'}
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" />
      </svg>
      {locale === 'en' ? 'BM' : 'EN'}
    </button>
  )
}
