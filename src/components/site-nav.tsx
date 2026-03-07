'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export function SiteNav() {
  const pathname = usePathname()

  return (
    <nav className="bg-primary-800">
      <div className="mx-auto max-w-5xl px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold text-white tracking-tight">Skim Pintar</span>
          <span className="hidden sm:block text-xs text-primary-300 font-medium">Masjid Ar-Raudhah</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/my"
            className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              pathname === '/my'
                ? 'text-white bg-primary-700'
                : 'text-primary-200 hover:text-white hover:bg-primary-700/50'
            }`}
          >
            <span className="hidden sm:inline">My Dashboard</span>
            <span className="sm:hidden">My</span>
          </Link>
          {pathname !== '/pledge' && pathname !== '/' && (
            <Link
              href="/pledge"
              className="text-sm font-semibold bg-gold-500 text-white px-4 py-1.5 rounded-lg hover:bg-gold-600 transition-colors"
            >
              Pledge
            </Link>
          )}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
}
