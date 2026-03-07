import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'received' | 'pending' | 'missed' | 'active' | 'paused' | 'cancelled'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant: BadgeVariant
}

const variantStyles: Record<BadgeVariant, string> = {
  received: 'bg-green-100 text-green-800',
  pending: 'bg-gold-100 text-gold-800',
  missed: 'bg-red-100 text-red-800',
  active: 'bg-primary-100 text-primary-800',
  paused: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium uppercase',
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  )
}

export { Badge }
export type { BadgeProps, BadgeVariant }
