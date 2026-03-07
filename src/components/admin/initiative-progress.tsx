import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface Initiative {
  name: string
  allocated: number
  target: number
  color: string
}

interface InitiativeProgressProps {
  initiatives: Initiative[]
  totalReceived: number
}

export function InitiativeProgress({ initiatives, totalReceived }: InitiativeProgressProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Initiative Funding</CardTitle>
          <span className="text-sm text-gray-500">
            Total received: {formatCurrency(totalReceived)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-5">
        {initiatives.map((init) => {
          const pct = init.target > 0 ? Math.min((init.allocated / init.target) * 100, 100) : 0
          return (
            <div key={init.name}>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-800">{init.name}</span>
                <span className="text-xs text-gray-500">
                  {formatCurrency(init.allocated)} / {formatCurrency(init.target)}
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${init.color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-1 text-right">
                <span className="text-xs text-gray-400">{Math.round(pct)}%</span>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
