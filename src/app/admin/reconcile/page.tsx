'use client'

import { useState, useRef, useCallback, type DragEvent } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import type { BankRow, MatchedItem } from '@/lib/reconcile'

interface ReconcileResult {
  month: string
  totalBankRows: number
  matched: MatchedItem[]
  unmatched: BankRow[]
  duplicates: { bankRow: BankRow; donationId: number }[]
}

function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default function ReconcilePage() {
  const [month, setMonth] = useState(getCurrentMonth())
  const [result, setResult] = useState<ReconcileResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setError('Please upload a CSV file')
      return
    }
    setSelectedFile(file)
    setError(null)
    setResult(null)
    setSuccess(null)
  }, [])

  const handleDrag = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0])
      }
    },
    [handleFile],
  )

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a CSV file first')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('month', month)

      const res = await fetch('/api/reconcile', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to process CSV')
        return
      }

      setResult(data)
    } catch {
      setError('Failed to upload file. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (!result || result.matched.length === 0) return

    setApplying(true)
    setError(null)

    try {
      const matchedIds = result.matched.map((m) => m.donationId)

      const res = await fetch('/api/reconcile/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchedIds }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to apply matches')
        return
      }

      setSuccess(
        `Successfully updated ${data.updated} of ${data.total} donation(s) to RECEIVED.`,
      )
      setResult(null)
      setSelectedFile(null)
    } catch {
      setError('Failed to apply matches. Please try again.')
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Bank Statement Reconciliation</CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Upload a CSV bank statement to match payments against pending
            donations.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Month selector */}
          <div>
            <label
              htmlFor="month"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Month
            </label>
            <input
              id="month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="block w-full sm:w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Drag & drop zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragActive
                ? 'border-primary-500 bg-primary-50'
                : selectedFile
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFile(e.target.files[0])
                }
              }}
              className="hidden"
            />

            {selectedFile ? (
              <div className="space-y-2">
                <svg
                  className="mx-auto h-10 w-10 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm font-medium text-green-700">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  Click or drop another file to replace
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <svg
                  className="mx-auto h-10 w-10 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
                <p className="text-sm font-medium text-gray-600">
                  Drag & drop your CSV file here, or click to browse
                </p>
                <p className="text-xs text-gray-400">
                  CSV must have Date, Reference, and Amount columns
                </p>
              </div>
            )}
          </div>

          {/* Upload button */}
          <div className="flex gap-3">
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || loading}
            >
              {loading ? 'Processing...' : 'Upload & Match'}
            </Button>
            {selectedFile && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedFile(null)
                  setResult(null)
                  setError(null)
                  setSuccess(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold text-green-700">
                  {result.matched.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Matched</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {result.unmatched.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Unmatched</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold text-red-600">
                  {result.duplicates.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Duplicates</p>
              </CardContent>
            </Card>
          </div>

          {/* Matched Section */}
          {result.matched.length > 0 && (
            <Card>
              <CardHeader className="bg-green-50 border-b border-green-100">
                <CardTitle className="text-green-800">
                  Matched Payments ({result.matched.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {result.matched.map((item, i) => (
                    <div
                      key={i}
                      className="px-4 py-3 sm:px-6 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.donorName || 'Unknown Donor'}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">
                          {item.bankRow.reference}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(item.bankRow.amount)}
                        </span>
                        {item.amountMismatch && (
                          <Badge variant="missed">Amount Mismatch</Badge>
                        )}
                        <Badge variant="received">Matched</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Unmatched Section */}
          {result.unmatched.length > 0 && (
            <Card>
              <CardHeader className="bg-yellow-50 border-b border-yellow-100">
                <CardTitle className="text-yellow-800">
                  Unmatched Bank Rows ({result.unmatched.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {result.unmatched.map((row, i) => (
                    <div
                      key={i}
                      className="px-4 py-3 sm:px-6 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 font-mono truncate">
                          {row.reference}
                        </p>
                        <p className="text-xs text-gray-500">{row.date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(row.amount)}
                        </span>
                        <Badge variant="pending">Unmatched</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Duplicates Section */}
          {result.duplicates.length > 0 && (
            <Card>
              <CardHeader className="bg-red-50 border-b border-red-100">
                <CardTitle className="text-red-800">
                  Duplicate Payments ({result.duplicates.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {result.duplicates.map((dup, i) => (
                    <div
                      key={i}
                      className="px-4 py-3 sm:px-6 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 font-mono truncate">
                          {dup.bankRow.reference}
                        </p>
                        <p className="text-xs text-gray-500">
                          {dup.bankRow.date} -- Donation #{dup.donationId}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(dup.bankRow.amount)}
                        </span>
                        <Badge variant="missed">Duplicate</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Apply button */}
          {result.matched.length > 0 && (
            <div className="flex justify-end">
              <Button
                onClick={handleApply}
                disabled={applying}
                size="lg"
              >
                {applying
                  ? 'Applying...'
                  : `Apply All Matches (${result.matched.length})`}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
