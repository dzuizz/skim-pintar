'use client'

import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
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

interface StepAmountProps {
  data: PledgeFormData
  onChange: (data: Partial<PledgeFormData>) => void
  errors: Record<string, string>
}

const presets = [
  { amount: 10, description: 'Keeps our youth programmes and classes running' },
  { amount: 30, description: 'Funds Quran classes, mentorship & community events' },
  { amount: 50, description: 'Supports families in need and outreach programmes' },
  { amount: 100, description: 'Powers education, welfare & youth development' },
]

const frequencyOptions = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'ANNUAL', label: 'Annual' },
]

function getReminderDayOptions(frequency: string) {
  const suffix =
    frequency === 'QUARTERLY'
      ? 'of every quarter'
      : frequency === 'ANNUAL'
        ? 'of the year'
        : 'of every month'
  return [
    { value: '1', label: `1st ${suffix}` },
    { value: '15', label: `15th ${suffix}` },
    { value: '25', label: `25th ${suffix}` },
  ]
}

function frequencySuffix(frequency: string): string {
  switch (frequency) {
    case 'QUARTERLY':
      return '/quarter'
    case 'ANNUAL':
      return '/year'
    default:
      return '/month'
  }
}

export function StepAmount({ data, onChange, errors }: StepAmountProps) {
  function selectPreset(amount: number) {
    onChange({ amount, customAmount: '' })
  }

  function handleCustomChange(value: string) {
    // Allow only digits and decimal point
    const cleaned = value.replace(/[^0-9.]/g, '')
    const parsed = parseFloat(cleaned)
    onChange({
      customAmount: cleaned,
      amount: isNaN(parsed) ? 0 : parsed,
    })
  }

  return (
    <div className="space-y-6">
      {/* Preset amount cards */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Select an amount
        </label>
        <div className="grid grid-cols-2 gap-3">
          {presets.map((preset) => {
            const isSelected = data.amount === preset.amount && data.customAmount === ''
            return (
              <button
                key={preset.amount}
                type="button"
                onClick={() => selectPreset(preset.amount)}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  isSelected
                    ? 'border-gold-500 bg-gold-50 dark:bg-gold-900/20 shadow-sm'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 bg-white dark:bg-gray-800'
                }`}
              >
                <span
                  className={`text-xl font-bold ${
                    isSelected ? 'text-gold-700 dark:text-gold-400' : 'text-primary-800 dark:text-primary-200'
                  }`}
                >
                  {formatCurrency(preset.amount)}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{frequencySuffix(data.frequency)}</span>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {preset.description}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom amount */}
      <div>
        <Input
          label="Or enter a custom amount"
          placeholder="Enter amount in SGD"
          value={data.customAmount}
          onChange={(e) => handleCustomChange(e.target.value)}
          error={errors.amount}
        />
      </div>

      {/* Frequency */}
      <Select
        label="Donation Frequency"
        options={frequencyOptions}
        value={data.frequency}
        onChange={(e) =>
          onChange({ frequency: e.target.value as PledgeFormData['frequency'] })
        }
        error={errors.frequency}
      />

      {/* Reminder Day */}
      <Select
        label="Reminder Day"
        options={getReminderDayOptions(data.frequency)}
        value={String(data.reminderDay)}
        onChange={(e) => onChange({ reminderDay: parseInt(e.target.value, 10) })}
        error={errors.reminderDay}
      />
    </div>
  )
}
