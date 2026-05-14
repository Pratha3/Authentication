import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { DiscoverClient } from '@/features/events/DiscoverClient'

export const metadata: Metadata = { title: 'Discover Events' }

export default function DiscoverPage() {
  return (
    <>
      <Navbar />
      <DiscoverClient />
    </>
  )
}
