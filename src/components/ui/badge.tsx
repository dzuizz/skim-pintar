import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'received' | 'pending' | 'missed' | 'active' | 'paused' | 'cancelled'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant: BadgeVariant
}

const variantStyles: Record<BadgeVariant, string> = {
  received: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400',
  pending: 'bg-gold-100 text-gold-800 dark:bg-gold-900/30 dark:text-gold-400',
  missed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  active: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400',
  paused: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-3 py-1 text-xs font-medium uppercase',
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  )
}

export { Badge }
export type { BadgeProps, BadgeVariant }
