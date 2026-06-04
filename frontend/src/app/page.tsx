import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { HorizontalScrollSection } from '@/components/events/HorizontalScrollSection'

export const metadata: Metadata = {
  title: 'EventSphere - Discover Local Events Near You',
}

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main className="flex flex-col bg-background relative">
        {/* Dynamic vertical-to-horizontal pinning scroll track */}
        <HorizontalScrollSection />
      </main>
    </>
  )
}

