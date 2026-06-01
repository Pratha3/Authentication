'use client'
import Link from 'next/link'
import { ArrowRight, Compass, LayoutDashboard, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth.store'
import { ROUTES } from '@/constants'

export function HeroCTA() {
  const { user, profile } = useAuthStore()
  const isOrganizer = profile?.role === 'organizer' || profile?.role === 'admin'

  if (user) {
    return (
      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild size="lg" className="h-12 px-6 shadow-lg shadow-primary/20">
          <Link href={ROUTES.DISCOVER}>
            <Compass className="mr-2 h-5 w-5" />
            Explore Events
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        {isOrganizer ? (
          <Button asChild size="lg" variant="outline" className="h-12 bg-background/70 px-6 backdrop-blur">
            <Link href={ROUTES.ORGANIZER.CREATE}>
              <Plus className="mr-2 h-5 w-5" />
              Create Event
            </Link>
          </Button>
        ) : (
          <Button asChild size="lg" variant="outline" className="h-12 bg-background/70 px-6 backdrop-blur">
            <Link href={ROUTES.ORGANIZER.DASHBOARD}>
              <LayoutDashboard className="mr-2 h-5 w-5" />
              My Dashboard
            </Link>
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col justify-center gap-3 sm:flex-row">
      <Button asChild size="lg" className="h-12 px-6 shadow-lg shadow-primary/20">
        <Link href={ROUTES.DISCOVER}>
          <Compass className="mr-2 h-5 w-5" />
          Explore Events
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
      <Button asChild size="lg" variant="outline" className="h-12 bg-background/70 px-6 backdrop-blur">
        <Link href={ROUTES.SIGNUP}>Create Account - It&apos;s Free</Link>
      </Button>
    </div>
  )
}
