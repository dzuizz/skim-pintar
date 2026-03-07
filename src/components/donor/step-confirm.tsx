'use client'

import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface PledgeFormData {
  name: string
  phone: string
  email: string
  nricLast4: string
  reminderChannel: 'WHATSAPP' | 'SMS' | 'EMAIL'
  amount: number
  customAmount: string
  frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'
  reminderDay: number
}

interface StepConfirmProps {
  data: PledgeFormData
  agreed: boolean
  onAgreeChange: (agreed: boolean) => void
}

const frequencyLabels: Record<string, string> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  ANNUAL: 'Annual',
}

const channelLabels: Record<string, string> = {
  WHATSAPP: 'WhatsApp',
  SMS: 'SMS',
  EMAIL: 'Email',
}

const dayLabels: Record<number, string> = {
  1: '1st',
  15: '15th',
  25: '25th',
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 8) return `+65 ${digits.slice(0, 4)} ${digits.slice(4)}`
  if (digits.startsWith('65') && digits.length === 10)
    return `+65 ${digits.slice(2, 6)} ${digits.slice(6)}`
  return phone
}

export function StepConfirm({ data, agreed, onAgreeChange }: StepConfirmProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="py-6">
          <h3 className="text-lg font-semibold text-primary-800 mb-4">
            Pledge Summary
          </h3>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Name</dt>
              <dd className="text-sm font-medium text-gray-900">{data.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Mobile</dt>
              <dd className="text-sm font-medium text-gray-900">
                {formatPhone(data.phone)}
              </dd>
            </div>
            {data.email && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Email</dt>
                <dd className="text-sm font-medium text-gray-900">{data.email}</dd>
              </div>
            )}
            <div className="border-t border-gray-100 pt-3 flex justify-between">
              <dt className="text-sm text-gray-500">Amount</dt>
              <dd className="text-sm font-medium text-gray-900">
                {formatCurrency(data.amount)} / {frequencyLabels[data.frequency]?.toLowerCase()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Reminder Day</dt>
              <dd className="text-sm font-medium text-gray-900">
                {dayLabels[data.reminderDay] || `${data.reminderDay}th`} of the month
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Reminder Via</dt>
              <dd className="text-sm font-medium text-gray-900">
                {channelLabels[data.reminderChannel]}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm text-gray-600 leading-relaxed">
          By confirming, you are making a voluntary pledge to donate regularly to
          Masjid Ar-Raudhah. This is not a binding contract — you can pause or
          cancel anytime. Each donation requires your manual approval via PayNow.
        </p>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => onAgreeChange(e.target.checked)}
          className="mt-0.5 h-5 w-5 rounded border-gray-300 text-primary-700 focus:ring-primary-500"
        />
        <span className="text-sm text-gray-700">
          I understand and agree to the above
        </span>
      </label>
    </div>
  )
}
