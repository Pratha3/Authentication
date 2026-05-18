import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { MyRegistrationsClient } from '@/features/registrations/MyRegistrationsClient'

export const metadata: Metadata = { title: 'My Registrations' }

export default function RegisteredEventsPage() {
  return (
    <>
      <Navbar />
      <MyRegistrationsClient />
    </>
  )
}
