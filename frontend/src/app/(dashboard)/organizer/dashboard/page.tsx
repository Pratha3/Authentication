import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { OrganizerDashboardClient } from '@/features/organizers/OrganizerDashboardClient'

export const metadata: Metadata = { title: 'Organizer Dashboard' }

export default function OrganizerDashboardPage() {
  return (
    <>
      <Navbar />
      <OrganizerDashboardClient />
    </>
  )
}
