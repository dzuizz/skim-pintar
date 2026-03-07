'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface PledgeActionsProps {
  pledgeId: number
  currentStatus: string
}

export function PledgeActions({ pledgeId, currentStatus }: PledgeActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function handleStatusChange(newStatus: string) {
    setLoading(newStatus)
    try {
      const res = await fetch(`/api/pledges/${pledgeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Failed to update pledge status')
        return
      }
      router.refresh()
    } catch {
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {currentStatus === 'ACTIVE' && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusChange('PAUSED')}
            disabled={loading !== null}
          >
            {loading === 'PAUSED' ? 'Pausing...' : 'Pause Pledge'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => handleStatusChange('CANCELLED')}
            disabled={loading !== null}
          >
            {loading === 'CANCELLED' ? 'Cancelling...' : 'Cancel Pledge'}
          </Button>
        </>
      )}
      {currentStatus === 'PAUSED' && (
        <>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleStatusChange('ACTIVE')}
            disabled={loading !== null}
          >
            {loading === 'ACTIVE' ? 'Reactivating...' : 'Reactivate Pledge'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => handleStatusChange('CANCELLED')}
            disabled={loading !== null}
          >
            {loading === 'CANCELLED' ? 'Cancelling...' : 'Cancel Pledge'}
          </Button>
        </>
      )}
      {currentStatus === 'CANCELLED' && (
        <Button
          variant="primary"
          size="sm"
          onClick={() => handleStatusChange('ACTIVE')}
          disabled={loading !== null}
        >
          {loading === 'ACTIVE' ? 'Reactivating...' : 'Reactivate Pledge'}
        </Button>
      )}
    </div>
  )
}

interface MarkReceivedButtonProps {
  donationId: number
}

export function MarkReceivedButton({ donationId }: MarkReceivedButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleMarkReceived() {
    setLoading(true)
    try {
      const res = await fetch(`/api/donations/${donationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'RECEIVED',
          receivedAt: new Date().toISOString(),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Failed to update donation')
        return
      }
      router.refresh()
    } catch {
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="primary"
      size="sm"
      onClick={handleMarkReceived}
      disabled={loading}
    >
      {loading ? 'Updating...' : 'Mark as Received'}
    </Button>
  )
}
