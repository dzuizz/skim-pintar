import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { type ReactNode } from 'react'

interface StatCardProps {
  icon: ReactNode
  value: string
  label: string
  accentClass?: string
}

export function StatCard({ icon, value, label, accentClass }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded',
            accentClass ?? 'bg-primary-50 text-primary-700',
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}
