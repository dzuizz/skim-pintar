'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AdminDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return null
  }

  if (!session) {
    return null
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm text-gray-500 font-medium">Total Donors</p>
          <p className="text-2xl font-bold text-primary-800 mt-1">--</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm text-gray-500 font-medium">Active Pledges</p>
          <p className="text-2xl font-bold text-primary-800 mt-1">--</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm text-gray-500 font-medium">Monthly Target</p>
          <p className="text-2xl font-bold text-primary-800 mt-1">--</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm text-gray-500 font-medium">This Month</p>
          <p className="text-2xl font-bold text-primary-800 mt-1">--</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Welcome, {session.user?.name || 'Admin'}
        </h2>
        <p className="text-gray-600">
          Dashboard overview will be available here. Use the sidebar to navigate
          between admin sections.
        </p>
      </div>
    </div>
  )
}
