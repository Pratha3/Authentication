import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { EventFormClient } from '@/features/organizers/EventFormClient'

export const metadata: Metadata = { title: 'Create Event' }

export default function CreateEventPage() {
  return (
    <>
      <Navbar />
      <EventFormClient mode="create" />
    </>
  )
}
