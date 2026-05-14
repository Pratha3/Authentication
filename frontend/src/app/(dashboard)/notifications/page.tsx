import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { NotificationsClient } from '@/features/notifications/NotificationsClient'

export const metadata: Metadata = { title: 'Notifications' }

export default function NotificationsPage() {
  return (
    <>
      <Navbar />
      <NotificationsClient />
    </>
  )
}
