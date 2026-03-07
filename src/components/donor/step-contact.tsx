'use client'

import { Input } from '@/components/ui/input'

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

interface StepContactProps {
  data: PledgeFormData
  onChange: (data: Partial<PledgeFormData>) => void
  errors: Record<string, string>
}

const channels = [
  { value: 'WHATSAPP' as const, label: 'WhatsApp' },
  { value: 'SMS' as const, label: 'SMS' },
  { value: 'EMAIL' as const, label: 'Email' },
]

export function StepContact({ data, onChange, errors }: StepContactProps) {
  return (
    <div className="space-y-5">
      <Input
        label="Name"
        placeholder="Your full name"
        value={data.name}
        onChange={(e) => onChange({ name: e.target.value })}
        error={errors.name}
        required
      />

      <Input
        label="Mobile Number"
        placeholder="8123 4567"
        value={data.phone}
        onChange={(e) => onChange({ phone: e.target.value })}
        error={errors.phone}
        helperText="Singapore mobile number (8 digits)"
        required
      />

      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        value={data.email}
        onChange={(e) => onChange({ email: e.target.value })}
        error={errors.email}
      />

      <Input
        label="NRIC Last 4 Digits"
        placeholder="e.g. 123A"
        value={data.nricLast4}
        onChange={(e) => onChange({ nricLast4: e.target.value.slice(0, 4).toUpperCase() })}
        error={errors.nricLast4}
        maxLength={4}
        helperText="Optional — for tax deduction receipt matching"
      />

      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Preferred Reminder Channel
        </label>
        <div className="flex flex-wrap gap-3">
          {channels.map((channel) => (
            <label
              key={channel.value}
              className={`flex items-center gap-2 cursor-pointer rounded-lg border px-4 py-2.5 text-sm transition-colors ${
                data.reminderChannel === channel.value
                  ? 'border-gold-500 bg-gold-50 text-gold-700'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name="reminderChannel"
                value={channel.value}
                checked={data.reminderChannel === channel.value}
                onChange={() => onChange({ reminderChannel: channel.value })}
                className="sr-only"
              />
              <span
                className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                  data.reminderChannel === channel.value
                    ? 'border-gold-500'
                    : 'border-gray-400'
                }`}
              >
                {data.reminderChannel === channel.value && (
                  <span className="h-2 w-2 rounded-full bg-gold-500" />
                )}
              </span>
              {channel.label}
            </label>
          ))}
        </div>
        {errors.reminderChannel && (
          <p className="mt-1.5 text-xs text-red-600">{errors.reminderChannel}</p>
        )}
      </div>
    </div>
  )
}
