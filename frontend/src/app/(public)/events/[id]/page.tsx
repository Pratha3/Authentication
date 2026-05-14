import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { EventDetailClient } from '@/features/events/EventDetailClient'

export const metadata: Metadata = { title: 'Event Details' }

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <>
      <Navbar />
      <EventDetailClient slug={id} />
    </>
  )
}
