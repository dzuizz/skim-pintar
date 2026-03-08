'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface AtRiskPledge {
  pledgeId: number
  donorId: number
  donorName: string
  phone: string
  reminderChannel: string
  amount: number
  missedCount: number
  graceDeadline: string | null
  pledgedSince: string
}

interface ReminderMessage {
  donorName: string
  channel: string
  stage: number
  message: string
}

export function AtRiskDonors() {
  const [pledges, setPledges] = useState<AtRiskPledge[]>([])
  const [loading, setLoading] = useState(true)
  const [previewDonor, setPreviewDonor] = useState<AtRiskPledge | null>(null)
  const [reminderResult, setReminderResult] = useState<{ donor: AtRiskPledge; messages: ReminderMessage[] } | null>(null)
  const [sendingFor, setSendingFor] = useState<number | null>(null)

  const fetchAtRisk = useCallback(async () => {
    try {
      const res = await fetch('/api/pledges/at-risk')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setPledges(data)
    } catch {
      // Silently fail — this is a supplementary widget
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAtRisk()
  }, [fetchAtRisk])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>At-Risk Donors</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (pledges.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>At-Risk Donors</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-3 text-primary-600 dark:text-primary-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span className="text-sm font-medium">All donors are in good standing</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  function formatDeadline(deadline: string | null): string {
    if (!deadline) return 'Not set'
    const d = new Date(deadline)
    const now = new Date()
    const daysLeft = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (daysLeft <= 0) return 'Expired'
    return `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`
  }

  function generateWhatsAppMessage(donor: AtRiskPledge): string {
    return `Assalamualaikum ${donor.donorName},

Kami dari Masjid Ar-Raudhah ingin menyemak khabar. Kami perasan sumbangan bulanan anda sebanyak ${formatCurrency(donor.amount)} belum diterima untuk ${donor.missedCount} bulan berturut-turut.

Kami faham kadang-kadang keadaan berubah. Tiada tekanan sama sekali — jika anda ingin:

1. Teruskan ikrar anda — sila buat pindahan melalui PayNow ke UEN S93MQ0024E
2. Jeda ikrar anda sementara — maklumkan kami dan kami akan jeda ia untuk anda
3. Kemas kini jumlah anda — kami boleh laraskan ke apa sahaja yang sesuai

Terima kasih kerana menjadi sebahagian daripada komuniti Ar-Raudhah. Sokongan anda amat bermakna.

Jazakallahu Khairan,
Masjid Ar-Raudhah`
  }

  async function handleSendReminder(donor: AtRiskPledge) {
    setSendingFor(donor.donorId)
    try {
      const res = await fetch('/api/cron/send-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donorId: donor.donorId }),
      })
      if (!res.ok) throw new Error('Failed to generate reminder')
      const data = await res.json()
      if (data.messages && data.messages.length > 0) {
        setReminderResult({ donor, messages: data.messages })
      } else {
        setReminderResult({ donor, messages: [{ donorName: donor.donorName, channel: donor.reminderChannel, stage: 0, message: 'No pending reminder needed — donor may have already paid this month.' }] })
      }
    } catch {
      alert('Failed to generate reminder. Please try again.')
    } finally {
      setSendingFor(null)
    }
  }

  function channelLabel(channel: string): string {
    switch (channel?.toUpperCase()) {
      case 'SMS': return 'SMS'
      case 'EMAIL': return 'Email'
      default: return 'WhatsApp'
    }
  }

  async function handleExtendGrace(pledgeId: number) {
    const newDeadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    await fetch(`/api/pledges/${pledgeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ graceDeadline: newDeadline }),
    })
    fetchAtRisk()
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>At-Risk Donors</CardTitle>
            <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
              {pledges.length}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {pledges.map((p) => (
            <div
              key={p.pledgeId}
              className="rounded border border-gray-200 dark:border-gray-700 p-3"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {p.donorName}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${
                      p.missedCount >= 3
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                    }`}>
                      {p.missedCount} missed
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatCurrency(p.amount)}/mo</span>
                    <span>{formatDeadline(p.graceDeadline)}</span>
                  </div>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleSendReminder(p)}
                  disabled={sendingFor === p.donorId}
                  className="flex items-center gap-1.5 rounded bg-primary-50 dark:bg-primary-900/20 px-3 py-1.5 text-xs font-medium text-primary-700 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors disabled:opacity-50"
                >
                  {sendingFor === p.donorId ? 'Generating...' : `Send Reminder (${channelLabel(p.reminderChannel)})`}
                </button>
                <a
                  href={`https://wa.me/${p.phone.replace(/\+/g, '')}?text=${encodeURIComponent(generateWhatsAppMessage(p))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded bg-green-50 dark:bg-green-900/20 px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp
                </a>
                <button
                  onClick={() => setPreviewDonor(p)}
                  className="flex items-center gap-1.5 rounded bg-gray-50 dark:bg-gray-700/50 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Preview WhatsApp message"
                >
                  Preview
                </button>
                <button
                  onClick={() => handleExtendGrace(p.pledgeId)}
                  className="flex items-center gap-1.5 rounded bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                >
                  Extend Grace (+14 days)
                </button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* WhatsApp Message Preview Modal */}
      {previewDonor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPreviewDonor(null)}>
          <div
            className="mx-4 w-full max-w-md rounded bg-white dark:bg-gray-800 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between rounded-t bg-green-600 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white text-sm font-bold">
                  {previewDonor.donorName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{previewDonor.donorName}</p>
                  <p className="text-xs text-green-100">{previewDonor.phone}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewDonor(null)}
                className="text-white/80 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Chat body */}
            <div className="bg-[#e5ddd5] dark:bg-gray-900 p-4 min-h-[200px]">
              <div className="max-w-[85%] rounded bg-white dark:bg-gray-700 p-3 shadow-sm">
                <p className="whitespace-pre-line text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                  {generateWhatsAppMessage(previewDonor)}
                </p>
                <p className="mt-1 text-right text-[10px] text-gray-400">
                  {new Date().toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="rounded-b border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
              <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                This is a preview of the WhatsApp message that would be sent to this donor.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reminder Generated Modal */}
      {reminderResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setReminderResult(null)}>
          <div
            className="mx-4 w-full max-w-lg rounded bg-white dark:bg-gray-800 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Reminder for {reminderResult.donor.donorName}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Preferred channel: {channelLabel(reminderResult.donor.reminderChannel)}
                </p>
              </div>
              <button
                onClick={() => setReminderResult(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {reminderResult.messages.map((msg, i) => (
                <div key={i} className="rounded border border-gray-200 dark:border-gray-700 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      via {channelLabel(msg.channel)} {msg.stage > 0 && `· Stage ${msg.stage}`}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(msg.message)
                        const btn = document.activeElement as HTMLButtonElement
                        if (btn) { btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = 'Copy' }, 2000) }
                      }}
                      className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="whitespace-pre-line text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                    {msg.message}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Copy the message and send via {channelLabel(reminderResult.donor.reminderChannel)}
              </p>
              {reminderResult.donor.reminderChannel?.toUpperCase() !== 'EMAIL' && (
                <a
                  href={`https://wa.me/${reminderResult.donor.phone.replace(/\+/g, '')}?text=${encodeURIComponent(reminderResult.messages[0]?.message || '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded bg-green-50 dark:bg-green-900/20 px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                >
                  Open WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
