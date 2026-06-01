import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  CalendarCheck,
  Map,
  Music,
  Route,
  Sparkles,
  Star,
  Users,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/layout/Navbar'
import { FeaturedEventsSection } from '@/components/events/FeaturedEventsSection'
import { CategoryGrid } from '@/components/events/CategoryGrid'
import { HeroCTA } from '@/components/shared/HeroCTA'
import { ParallaxRoot } from '@/components/shared/ParallaxRoot'
import { StartOrganizingButton } from '@/components/shared/StartOrganizingButton'
import { ROUTES } from '@/constants'

export const metadata: Metadata = {
  title: 'EventSphere - Discover Local Events Near You',
}

const heroTiles = [
  { icon: Route, title: 'Sunrise Run', meta: '6:30 AM - Riverfront', tone: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/20' },
  { icon: Music, title: 'Indie Night', meta: 'Live stage - Saturday', tone: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-400/20' },
  { icon: CalendarCheck, title: 'Founder Mixer', meta: 'Coworking hall', tone: 'bg-sky-500/15 text-sky-300 border-sky-400/20' },
  { icon: Sparkles, title: 'Art Walk', meta: 'Old city lanes', tone: 'bg-amber-500/15 text-amber-300 border-amber-400/20' },
  { icon: Users, title: 'Community Jam', meta: 'Open mic evening', tone: 'bg-rose-500/15 text-rose-300 border-rose-400/20' },
  { icon: Map, title: 'Food Trail', meta: 'Local favorites', tone: 'bg-teal-500/15 text-teal-300 border-teal-400/20' },
]

const stats = [
  { icon: Zap, value: '10K+', label: 'Events listed' },
  { icon: Users, value: '50K+', label: 'Active users' },
  { icon: Map, value: '100+', label: 'Cities covered' },
]

export default function LandingPage() {
  return (
    <>
      <ParallaxRoot />
      <Navbar />
      <main className="flex flex-col bg-background">
        <section className="parallax-scene relative isolate min-h-[calc(100vh-4rem)] overflow-hidden border-b border-border/40 bg-background">
          <div className="absolute inset-0 -z-10">
            <div className="parallax-layer parallax-slow absolute left-1/2 top-8 grid w-[920px] -translate-x-1/2 grid-cols-3 gap-4 opacity-35 blur-[0.2px] sm:opacity-50 lg:w-[1120px]">
              {heroTiles.map(({ icon: Icon, title, meta, tone }, idx) => (
                <div
                  key={title}
                  className={`min-h-32 rounded-lg border p-4 shadow-2xl backdrop-blur ${tone} ${idx % 2 ? 'translate-y-8' : ''}`}
                >
                  <Icon className="mb-6 h-6 w-6" />
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
                </div>
              ))}
            </div>
            <div className="parallax-layer parallax-medium absolute -left-24 top-28 hidden h-64 w-64 rotate-6 rounded-lg border border-primary/15 bg-primary/5 shadow-2xl md:block" />
            <div className="absolute inset-0 bg-background/75 backdrop-blur-[1px]" />
          </div>

          <div className="container relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center py-20 text-center">
            <Badge variant="outline" className="mb-6 inline-flex border-primary/30 bg-background/70 px-3 py-1 text-primary shadow-sm backdrop-blur">
              <Zap className="mr-1.5 h-3.5 w-3.5" /> Live events near you
            </Badge>
            <h1 className="max-w-5xl text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl text-balance">
              Discover Local Events That Move You
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg text-balance">
              From marathons to meetups, cafe gatherings to community festivals, find and join
              experiences that matter to you right in your neighborhood.
            </p>

            <div className="mt-8">
              <HeroCTA />
            </div>

            <div className="mt-14 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
              {stats.map(({ icon: Icon, value, label }, idx) => (
                <div
                  key={label}
                  className="section-reveal rounded-lg border border-border/60 bg-card/75 px-5 py-4 text-left shadow-sm backdrop-blur"
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  <Icon className="mb-3 h-5 w-5 text-primary" />
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section-reveal container py-16 sm:py-20">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">Featured picks</p>
              <h2 className="text-3xl font-bold tracking-tight">Featured Events</h2>
              <p className="mt-1 text-sm text-muted-foreground">Handpicked experiences you won&apos;t want to miss</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="self-start sm:self-auto">
              <Link href={ROUTES.DISCOVER}>
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <FeaturedEventsSection />
        </section>

        <section className="section-reveal border-y border-border/40 bg-card/25 py-14 sm:py-16">
          <div className="container">
            <div className="mb-8">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">Find your lane</p>
              <h2 className="text-3xl font-bold tracking-tight">Browse by Category</h2>
              <p className="mt-1 text-sm text-muted-foreground">Find events that match your interests</p>
            </div>
            <CategoryGrid />
          </div>
        </section>

        <section className="section-reveal relative isolate overflow-hidden border-t border-border/40 bg-background">
          <div className="parallax-layer parallax-reverse absolute right-4 top-8 -z-10 hidden h-48 w-72 rounded-lg border border-primary/10 bg-card/60 shadow-xl md:block" />
          <div className="container py-16 text-center sm:py-20">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
              <Star className="h-6 w-6 text-primary" />
            </div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight">Host Your Own Event</h2>
            <p className="mx-auto mb-7 max-w-xl leading-7 text-muted-foreground">
              Become an organizer and bring your community together. Create events,
              manage attendees, and grow your audience.
            </p>
            <StartOrganizingButton />
          </div>
        </section>
      </main>
    </>
  )
}
