'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { QRDisplay } from '@/components/donor/qr-display'

interface PaymentMethodsProps {
  amount: number
  reference: string
}

type PaymentTab = 'paynow' | 'bank-transfer'

const BANK_DETAILS = {
  bankName: 'OCBC',
  accountNumber: '501-806368-001',
  accountName: 'MASJID AR-RAUDHAH',
}

export function PaymentMethods({ amount, reference }: PaymentMethodsProps) {
  const [activeTab, setActiveTab] = useState<PaymentTab>('paynow')

  return (
    <div className="space-y-4">
      {/* Tab selector */}
      <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
        <button
          type="button"
          onClick={() => setActiveTab('paynow')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === 'paynow'
              ? 'bg-white text-primary-800 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          PayNow QR
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('bank-transfer')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === 'bank-transfer'
              ? 'bg-white text-primary-800 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Bank Transfer
        </button>
      </div>

      {/* PayNow tab */}
      {activeTab === 'paynow' && (
        <QRDisplay amount={amount} reference={reference} />
      )}

      {/* Bank Transfer tab */}
      {activeTab === 'bank-transfer' && (
        <Card className="border-primary-100">
          <CardContent className="py-6">
            <h3 className="text-lg font-semibold text-primary-800 text-center mb-6">
              Bank Transfer Details
            </h3>

            <div className="space-y-4">
              <DetailRow label="Bank" value={BANK_DETAILS.bankName} />
              <DetailRow label="Account Number" value={BANK_DETAILS.accountNumber} copyable />
              <DetailRow label="Account Name" value={BANK_DETAILS.accountName} />
              <DetailRow label="Amount" value={formatCurrency(amount)} />
              <DetailRow label="Reference" value={reference} copyable />
            </div>

            <div className="mt-6 rounded-lg bg-gold-50 border border-gold-200 p-3">
              <p className="text-sm text-gold-800 leading-relaxed">
                Please include the reference code in your transfer remarks so we
                can match your donation to your pledge.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function DetailRow({
  label,
  value,
  copyable,
}: {
  label: string
  value: string
  copyable?: boolean
}) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-gray-500 flex-shrink-0">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-900 font-mono">
          {value}
        </span>
        {copyable && (
          <button
            onClick={handleCopy}
            type="button"
            className="text-xs px-2 py-0.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        )}
      </div>
    </div>
  )
}
