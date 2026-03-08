'use client'

import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import { useLocale } from '@/lib/use-locale'

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
  tier: 'INDIVIDUAL' | 'FAMILY' | 'CUSTOM'
  paymentMethod: 'MANUAL' | 'EGIRO'
}

interface StepAmountProps {
  data: PledgeFormData
  onChange: (data: Partial<PledgeFormData>) => void
  errors: Record<string, string>
}

export function StepAmount({ data, onChange, errors }: StepAmountProps) {
  const t = useLocale()

  const tiers = [
    {
      id: 'INDIVIDUAL' as const,
      name: t.pledge.tierIndividual,
      amount: 5,
      tagline: t.pledge.tierIndividualTagline,
      benefits: t.pledge.tierIndividualBenefits,
    },
    {
      id: 'FAMILY' as const,
      name: t.pledge.tierFamily,
      amount: 20,
      tagline: t.pledge.tierFamilyTagline,
      benefits: t.pledge.tierFamilyBenefits,
      popular: true,
    },
    {
      id: 'CUSTOM' as const,
      name: t.pledge.tierCustom,
      amount: 10,
      tagline: t.pledge.tierCustomTagline,
      benefits: t.pledge.tierCustomBenefits,
    },
  ]

  const frequencyOptions = [
    { value: 'MONTHLY', label: t.pledge.monthly },
    { value: 'QUARTERLY', label: t.pledge.quarterly },
    { value: 'ANNUAL', label: t.pledge.annual },
  ]

  function getReminderDayOptions(frequency: string) {
    const suffix =
      frequency === 'QUARTERLY'
        ? t.pledge.dayOfQuarter
        : frequency === 'ANNUAL'
          ? t.pledge.dayOfYear
          : t.pledge.dayOfMonth
    return [
      { value: '1', label: `1st ${suffix}` },
      { value: '15', label: `15th ${suffix}` },
      { value: '25', label: `25th ${suffix}` },
    ]
  }

  function frequencySuffix(frequency: string): string {
    switch (frequency) {
      case 'QUARTERLY':
        return t.pledge.perQuarter
      case 'ANNUAL':
        return t.pledge.perYear
      default:
        return t.pledge.perMonth
    }
  }

  function selectTier(tier: typeof tiers[number]) {
    if (tier.id === 'CUSTOM') {
      onChange({ tier: 'CUSTOM', amount: data.customAmount ? parseFloat(data.customAmount) || 0 : 0 })
    } else {
      onChange({ tier: tier.id, amount: tier.amount, customAmount: '' })
    }
  }

  function handleCustomChange(value: string) {
    const cleaned = value.replace(/[^0-9.]/g, '')
    const parsed = parseFloat(cleaned)
    onChange({
      customAmount: cleaned,
      amount: isNaN(parsed) ? 0 : parsed,
      tier: 'CUSTOM',
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {t.pledge.chooseGivingLevel}
        </label>
        <div className="grid gap-4">
          {tiers.map((tier) => {
            const isSelected = data.tier === tier.id
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => selectTier(tier)}
                className={`relative rounded-xl border-2 p-5 text-left transition-all ${
                  isSelected
                    ? 'border-gold-500 bg-gold-50 dark:bg-gold-900/20 shadow-sm'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 bg-white dark:bg-gray-800'
                }`}
              >
                {tier.popular && (
                  <span className="absolute -top-2.5 right-4 bg-gold-500 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {t.pledge.popular}
                  </span>
                )}
                <div className="flex items-baseline justify-between mb-2">
                  <span
                    className={`text-lg font-bold ${
                      isSelected ? 'text-gold-700 dark:text-gold-400' : 'text-primary-800 dark:text-primary-200'
                    }`}
                  >
                    {tier.name}
                  </span>
                  <span
                    className={`text-xl font-bold ${
                      isSelected ? 'text-gold-700 dark:text-gold-400' : 'text-primary-800 dark:text-primary-200'
                    }`}
                  >
                    {tier.id === 'CUSTOM' ? `${t.pledge.from} ${formatCurrency(tier.amount)}` : formatCurrency(tier.amount)}
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400">{frequencySuffix(data.frequency)}</span>
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{tier.tagline}</p>
                <ul className="space-y-1.5">
                  {tier.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <svg className="h-4 w-4 text-primary-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom amount input */}
      {data.tier === 'CUSTOM' && (
        <div>
          <Input
            label={t.pledge.customAmountLabel}
            placeholder={t.pledge.customAmountPlaceholder}
            value={data.customAmount}
            onChange={(e) => handleCustomChange(e.target.value)}
            error={errors.amount}
          />
        </div>
      )}

      {/* Frequency */}
      <Select
        label={t.pledge.donationFrequency}
        options={frequencyOptions}
        value={data.frequency}
        onChange={(e) =>
          onChange({ frequency: e.target.value as PledgeFormData['frequency'] })
        }
        error={errors.frequency}
      />

      {/* Reminder Day */}
      <Select
        label={t.pledge.reminderDay}
        options={getReminderDayOptions(data.frequency)}
        value={String(data.reminderDay)}
        onChange={(e) => onChange({ reminderDay: parseInt(e.target.value, 10) })}
        error={errors.reminderDay}
      />

      {/* Payment Method */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {t.pledge.paymentMethod}
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onChange({ paymentMethod: 'MANUAL' })}
            className={`rounded-xl border-2 p-4 text-left transition-all ${
              data.paymentMethod === 'MANUAL'
                ? 'border-gold-500 bg-gold-50 dark:bg-gold-900/20 shadow-sm'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 bg-white dark:bg-gray-800'
            }`}
          >
            <p className={`text-sm font-bold ${data.paymentMethod === 'MANUAL' ? 'text-gold-700 dark:text-gold-400' : 'text-primary-800 dark:text-primary-200'}`}>
              {t.pledge.payNowTransfer}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t.pledge.payNowDesc}
            </p>
          </button>
          <button
            type="button"
            onClick={() => onChange({ paymentMethod: 'EGIRO' })}
            className={`rounded-xl border-2 p-4 text-left transition-all ${
              data.paymentMethod === 'EGIRO'
                ? 'border-gold-500 bg-gold-50 dark:bg-gold-900/20 shadow-sm'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 bg-white dark:bg-gray-800'
            }`}
          >
            <p className={`text-sm font-bold ${data.paymentMethod === 'EGIRO' ? 'text-gold-700 dark:text-gold-400' : 'text-primary-800 dark:text-primary-200'}`}>
              {t.pledge.egiro}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t.pledge.egiroDesc}
            </p>
          </button>
        </div>
        {data.paymentMethod === 'EGIRO' && (
          <div className="mt-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 p-3">
            <p className="text-xs text-primary-800 dark:text-primary-300 leading-relaxed">
              {t.pledge.egiroInfo}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
