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
      <div className="flex flex-col justify-center gap-4 sm:flex-row animate-in fade-in">
        <Button asChild size="lg" className="h-12 px-8 font-bold shadow-lg shadow-primary/20 hover:shadow-glow-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
          <Link href={ROUTES.DISCOVER}>
            <Compass className="mr-2 h-5 w-5" />
            Explore Events
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/button:translate-x-0.5" />
          </Link>
        </Button>
        {isOrganizer ? (
          <Button asChild size="lg" variant="outline" className="h-12 bg-background/50 border-border/50 px-8 backdrop-blur hover:bg-background/80 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
            <Link href={ROUTES.ORGANIZER.CREATE}>
              <Plus className="mr-2 h-5 w-5" />
              Create Event
            </Link>
          </Button>
        ) : (
          <Button asChild size="lg" variant="outline" className="h-12 bg-background/50 border-border/50 px-8 backdrop-blur hover:bg-background/80 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
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
    <div className="flex flex-col justify-center gap-4 sm:flex-row animate-in fade-in">
      <Button asChild size="lg" className="h-12 px-8 font-bold shadow-lg shadow-primary/20 hover:shadow-glow-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
        <Link href={ROUTES.DISCOVER}>
          <Compass className="mr-2 h-5 w-5" />
          Explore Events
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/button:translate-x-0.5" />
        </Link>
      </Button>
      <Button asChild size="lg" variant="outline" className="h-12 bg-background/50 border-border/50 px-8 backdrop-blur hover:bg-background/80 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
        <Link href={ROUTES.SIGNUP}>Create Account - It&apos;s Free</Link>
      </Button>
    </div>
  )
}
