'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface QRDisplayProps {
  amount: number
  reference: string
  recipientName?: string
}

export function QRDisplay({
  amount,
  reference,
  recipientName = 'MASJID AR-RAUDHAH',
}: QRDisplayProps) {
  const [qrDataURL, setQrDataURL] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function fetchQR() {
      try {
        setLoading(true)
        setError(null)
        const params = new URLSearchParams({
          amount: String(amount),
          reference,
        })
        const res = await fetch(`/api/qr?${params}`)
        if (!res.ok) {
          throw new Error('Failed to generate QR code')
        }
        const data = await res.json()
        setQrDataURL(data.qrDataURL)
      } catch {
        setError('Unable to load QR code. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchQR()
  }, [amount, reference])

  function handleCopyReference() {
    navigator.clipboard.writeText(reference).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Card className="border-primary-100">
      <CardContent className="py-6">
        <h3 className="text-lg font-semibold text-primary-800 text-center mb-6">
          Pay via PayNow
        </h3>

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          {loading ? (
            <div className="w-64 h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-300 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
          ) : error ? (
            <div className="w-64 h-64 bg-red-50 rounded-lg flex items-center justify-center p-4">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataURL!}
                alt="PayNow QR Code"
                className="w-56 h-56 sm:w-64 sm:h-64"
              />
            </div>
          )}
        </div>

        {/* Amount */}
        <p className="text-center text-2xl font-bold text-primary-800 mb-4">
          {formatCurrency(amount)}
        </p>

        {/* Reference */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-sm text-gray-500">Ref:</span>
          <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-800">
            {reference}
          </code>
          <button
            onClick={handleCopyReference}
            className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
            type="button"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* Recipient */}
        <p className="text-center text-sm text-gray-500 mb-4">
          Recipient: <span className="font-medium text-gray-700">{recipientName}</span>
        </p>

        {/* Instruction */}
        <p className="text-center text-sm text-gray-500 leading-relaxed">
          Open your banking app and scan this QR code to complete your donation
        </p>
      </CardContent>
    </Card>
  )
}
