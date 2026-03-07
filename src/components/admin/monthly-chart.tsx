import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface MonthData {
  month: string // YYYY-MM
  label: string // "Jan", "Feb", etc.
  received: number
  pending: number
}

interface MonthlyChartProps {
  data: MonthData[]
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  const maxTotal = Math.max(...data.map((d) => d.received + d.pending), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Collections</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-end gap-3 h-48">
          {data.map((d) => {
            const receivedHeight = (d.received / maxTotal) * 100
            const pendingHeight = (d.pending / maxTotal) * 100
            const total = d.received + d.pending
            return (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {total > 0 ? formatCurrency(total) : ''}
                </span>
                <div className="w-full flex flex-col justify-end h-36 rounded-t-md overflow-hidden">
                  <div
                    className="bg-gold-300 transition-all"
                    style={{ height: `${pendingHeight}%` }}
                    title={`Pending: ${formatCurrency(d.pending)}`}
                  />
                  <div
                    className="bg-primary-600 transition-all"
                    style={{ height: `${receivedHeight}%` }}
                    title={`Received: ${formatCurrency(d.received)}`}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">{d.label}</span>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary-600" />
            Received
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-gold-300" />
            Pending
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
