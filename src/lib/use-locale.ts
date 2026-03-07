'use client'

import { useState, useEffect } from 'react'
import { translations, type Locale } from '@/lib/i18n'

export function useLocale() {
  const [locale, setLocale] = useState<Locale>('en')

  useEffect(() => {
    const saved = localStorage.getItem('locale') as Locale | null
    if (saved === 'ms' || saved === 'en') setLocale(saved)

    function handleLocaleChange(e: Event) {
      setLocale((e as CustomEvent).detail as Locale)
    }
    window.addEventListener('locale-change', handleLocaleChange)
    return () => window.removeEventListener('locale-change', handleLocaleChange)
  }, [])

  return translations[locale]
}
