'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Admin {
  id: number
  name: string
  email: string
  created_at: string
}

export default function SettingsPage() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)

  // New admin form
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchAdmins = useCallback(async () => {
    try {
      const res = await fetch('/api/admin')
      const data = await res.json()
      setAdmins(data.admins || [])
    } catch {
      console.error('Failed to fetch admins')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAdmins()
  }, [fetchAdmins])

  async function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setSubmitting(true)

    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to add admin' })
        return
      }

      setMessage({ type: 'success', text: `Admin "${data.admin.name}" added successfully` })
      setName('')
      setEmail('')
      setPassword('')
      fetchAdmins()
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-SG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Mosque Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Mosque Configuration</CardTitle>
          <CardDescription>PayNow receiving details for Masjid Ar-Raudhah</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">UEN</label>
            <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-900">
              T08CC4018F
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Name</label>
            <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900">
              MASJID AR-RAUDHAH
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Contact the system administrator to update these values.
          </p>
        </CardContent>
      </Card>

      {/* Admin Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Accounts</CardTitle>
          <CardDescription>Manage administrator access to the dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-gray-500 py-4 text-center">Loading admins...</div>
          ) : admins.length === 0 ? (
            <div className="text-sm text-gray-500 py-4 text-center">No admins found</div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left font-medium text-gray-500 px-6 py-2">Name</th>
                    <th className="text-left font-medium text-gray-500 px-6 py-2">Email</th>
                    <th className="text-left font-medium text-gray-500 px-6 py-2">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-6 py-3 text-gray-900 font-medium">{admin.name}</td>
                      <td className="px-6 py-3 text-gray-600">{admin.email}</td>
                      <td className="px-6 py-3 text-gray-500">{formatDate(admin.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add New Admin */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Admin</CardTitle>
          <CardDescription>Create a new administrator account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddAdmin} className="space-y-4">
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ahmad Bin Hassan"
              required
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. ahmad@arraudhah.org.sg"
              required
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600 text-xs font-medium"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            {message && (
              <div
                className={`text-sm px-4 py-2.5 rounded-lg ${
                  message.type === 'success'
                    ? 'bg-primary-50 text-primary-700 border border-primary-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {message.text}
              </div>
            )}

            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
              {submitting ? 'Adding...' : 'Add Admin'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
