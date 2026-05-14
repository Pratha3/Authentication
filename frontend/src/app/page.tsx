import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Compass, Zap, Users, Map, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/layout/Navbar'
import { FeaturedEventsSection } from '@/components/events/FeaturedEventsSection'
import { CategoryGrid } from '@/components/events/CategoryGrid'
import { ROUTES } from '@/constants'

export const metadata: Metadata = {
  title: 'EventSphere — Discover Local Events Near You',
}

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main className="flex flex-col">
        {/* Hero */}
        <section className="relative overflow-hidden section-gradient">
          <div className="container py-24 md:py-36 text-center">
            <Badge variant="outline" className="mb-6 border-primary/30 text-primary bg-primary/10 inline-flex">
              <Zap className="mr-1 h-3 w-3" /> Live events near you
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl text-balance mb-6">
              Discover Events That
              <span className="gradient-text">Move You</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-8 text-balance">
              From marathons to meetups, café gatherings to community festivals — find and join experiences that matter to you, happening right in your neighborhood.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="glow">
                <Link href={ROUTES.DISCOVER}>
                  <Compass className="mr-2 h-5 w-5" />
                  Explore Events
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={ROUTES.SIGNUP}>Create Account — It&apos;s Free</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-4 max-w-lg mx-auto">
              {[
                { icon: Zap, value: '10K+', label: 'Events Listed' },
                { icon: Users, value: '50K+', label: 'Active Users' },
                { icon: Map, value: '100+', label: 'Cities' },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="rounded-xl border border-border/50 bg-card/50 p-4">
                  <Icon className="h-5 w-5 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Events */}
        <section className="container py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">Featured Events</h2>
              <p className="text-muted-foreground text-sm mt-1">Handpicked experiences you won&apos;t want to miss</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href={ROUTES.DISCOVER}>View all <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <FeaturedEventsSection />
        </section>

        {/* Categories */}
        <section className="container py-8 pb-16">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">Browse by Category</h2>
            <p className="text-muted-foreground text-sm mt-1">Find events that match your interests</p>
          </div>
          <CategoryGrid />
        </section>

        {/* CTA */}
        <section className="border-t border-border/40 bg-card/30">
          <div className="container py-16 text-center">
            <Star className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Host Your Own Event</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Become an organizer and bring your community together. Create events, manage attendees, and grow your audience.
            </p>
            <Button asChild size="lg">
              <Link href={ROUTES.SIGNUP}>Start Organizing</Link>
            </Button>
          </div>
        </section>
      </main>
    </>
  )
}
