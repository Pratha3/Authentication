import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { AdminDashboardClient } from '@/features/admin/AdminDashboardClient'

export const metadata: Metadata = { title: 'Admin Dashboard' }

export default function AdminDashboardPage() {
  return (
    <>
      <Navbar />
      <AdminDashboardClient />
    </>
  )
}
