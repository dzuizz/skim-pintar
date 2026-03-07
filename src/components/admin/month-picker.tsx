'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Button } from '@/components/ui/button'

function formatMonthLabel(month: string): string {
  const [year, m] = month.split('-')
  const date = new Date(Number(year), Number(m) - 1)
  return date.toLocaleDateString('en-SG', { month: 'long', year: 'numeric' })
}

function addMonths(month: string, delta: number): string {
  const [year, m] = month.split('-')
  const date = new Date(Number(year), Number(m) - 1 + delta)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function getMaxMonth(): string {
  return addMonths(getCurrentMonth(), 1)
}

interface MonthPickerProps {
  currentMonth: string
}

export function MonthPicker({ currentMonth }: MonthPickerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const navigateToMonth = useCallback(
    (month: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('month', month)
      router.push(`/admin/donations?${params.toString()}`)
    },
    [router, searchParams],
  )

  const prevMonth = addMonths(currentMonth, -1)
  const nextMonth = addMonths(currentMonth, 1)
  const maxMonth = getMaxMonth()

  const canGoNext = nextMonth <= maxMonth

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigateToMonth(prevMonth)}
        aria-label="Previous month"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </Button>

      <span className="text-base font-semibold text-gray-800 dark:text-gray-100 min-w-[160px] text-center">
        {formatMonthLabel(currentMonth)}
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={() => navigateToMonth(nextMonth)}
        disabled={!canGoNext}
        aria-label="Next month"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </Button>
    </div>
  )
}
