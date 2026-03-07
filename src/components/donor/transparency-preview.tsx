import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface TransparencyPreviewProps {
  amount: number
  categories: {
    category: string
    percentage: number
    description: string
  }[]
  showDisclaimer?: boolean
}

const segmentColors = [
  'bg-primary-700',
  'bg-gold-500',
  'bg-primary-500',
  'bg-gold-400',
  'bg-primary-300',
]

const dotColors = [
  'bg-primary-700',
  'bg-gold-500',
  'bg-primary-500',
  'bg-gold-400',
  'bg-primary-300',
]

export function TransparencyPreview({
  amount,
  categories,
  showDisclaimer = true,
}: TransparencyPreviewProps) {
  return (
    <Card>
      <CardContent className="py-6">
        <h3 className="text-lg font-semibold text-primary-800 dark:text-primary-200 mb-4">
          Where Your {formatCurrency(amount)} Could Go
        </h3>

        {/* Stacked horizontal bar */}
        <div className="flex h-4 w-full rounded-full overflow-hidden mb-6">
          {categories.map((cat, index) => (
            <div
              key={cat.category}
              className={`${segmentColors[index % segmentColors.length]} transition-all`}
              style={{ width: `${cat.percentage}%` }}
              title={`${cat.category}: ${cat.percentage}%`}
            />
          ))}
        </div>

        {/* Category list */}
        <ul className="space-y-3">
          {categories.map((cat, index) => {
            const dollarAmount = (cat.percentage * amount) / 100
            return (
              <li key={cat.category} className="flex items-start gap-3">
                <span
                  className={`mt-1.5 h-3 w-3 flex-shrink-0 rounded-full ${dotColors[index % dotColors.length]}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {cat.category}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                      {cat.percentage}% &middot; {formatCurrency(dollarAmount)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {cat.description}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>

        {/* Disclaimer */}
        {showDisclaimer && (
          <p className="mt-6 text-xs text-gray-400 dark:text-gray-500 leading-relaxed border-t border-gray-100 dark:border-gray-700 pt-4">
            This breakdown is illustrative and reflects how Masjid Ar-Raudhah
            generally allocates its resources. It is not a binding allocation of
            your specific contribution. All contributions support Ar-Raudhah&apos;s
            general fund.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
