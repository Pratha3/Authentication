'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { useFeaturedEvents } from '@/hooks/useEvents'
import { EventCard } from './EventCard'
import { EventCardSkeleton } from './EventCardSkeleton'
import { EVENT_CATEGORIES, ROUTES } from '@/constants'
import { cn } from '@/lib/utils'
import { useEventsStore } from '@/store/events.store'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight,
  CalendarCheck,
  Compass,
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
import { HeroCTA } from '@/components/shared/HeroCTA'
import { StartOrganizingButton } from '@/components/shared/StartOrganizingButton'
import { ParallaxRoot } from '@/components/shared/ParallaxRoot'

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

const categoryGroups = [
  {
    title: 'Popular Interests',
    badge: 'Trending',
    color: 'text-primary border-primary/20 bg-primary/5',
    items: [
      { value: 'music', label: 'Music', emoji: '🎵', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
      { value: 'tech', label: 'Tech', emoji: '💻', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
      { value: 'sports', label: 'Sports', emoji: '⚽', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
      { value: 'food', label: 'Food', emoji: '🍕', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      { value: 'outdoor', label: 'Outdoor', emoji: '🌲', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    ]
  },
  {
    title: 'Social & Connect',
    badge: 'Community',
    color: 'text-secondary-foreground border-secondary/20 bg-secondary/5',
    items: [
      { value: 'meetup', label: 'Meetup', emoji: '🤝', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      { value: 'cafe', label: 'Café Event', emoji: '☕', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
      { value: 'community', label: 'Community', emoji: '🏘️', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
      { value: 'charity', label: 'Charity', emoji: '❤️', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
      { value: 'other', label: 'Other', emoji: '✨', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
    ]
  },
  {
    title: 'Skills & Wellness',
    badge: 'Growth',
    color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
    items: [
      { value: 'wellness', label: 'Wellness', emoji: '🧘', color: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
      { value: 'business', label: 'Business', emoji: '💼', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
      { value: 'workshop', label: 'Workshop', emoji: '🔧', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
      { value: 'art', label: 'Art', emoji: '🎨', color: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
      { value: 'marathon', label: 'Marathon', emoji: '🏃', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    ]
  }
]

export function HorizontalScrollSection() {
  const targetRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { setFilters } = useEventsStore()
  const { events, isLoading } = useFeaturedEvents()
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)')
    const listener = () => setIsDesktop(media.matches)
    setIsDesktop(media.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [])

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"]
  })

  // High-fidelity spring configurations for a premium snap-feel carousel
  const springConfig = { damping: 22, stiffness: 90, mass: 0.25 }
  const smoothProgress = useSpring(scrollYProgress, springConfig)

  // Map scroll progress across 4 panels (0 to 3 viewports of scroll distance)
  // Track has w-[400%], so we translate from 0% to -75% to bring Slide 4 into view.
  const x = useTransform(smoothProgress, [0, 1], ['0%', '-75%'])

  const handleCategoryClick = (category: string) => {
    setFilters({ category: [category] })
    router.push(ROUTES.DISCOVER)
  }

  return (
    <>
      <ParallaxRoot />
      <div ref={targetRef} className={cn('relative', isDesktop ? 'h-[400vh]' : 'h-auto')}>
        {/* Sticky Inner Frame */}
        <div className="lg:sticky lg:top-16 lg:h-[calc(100dvh-4rem)] lg:overflow-hidden flex flex-col lg:flex-row lg:flex-nowrap items-center bg-background w-full h-auto py-12 lg:py-0 px-4 sm:px-6 lg:px-0 gap-16 lg:gap-0 overflow-y-visible lg:overflow-y-hidden">
          {/* Sliding Content Track */}
          <motion.div
            style={{ x: isDesktop ? x : '0%' }}
            className="flex flex-col lg:flex-row lg:flex-nowrap w-full lg:w-[400%] lg:shrink-0 h-auto lg:h-full items-center gap-16 lg:gap-0 py-4 lg:py-0 select-none will-change-transform"
          >
            {/* PANEL 1: HERO SECTION */}
            <div className="w-full lg:w-[25%] h-auto lg:h-full flex flex-col justify-center shrink-0 relative overflow-hidden py-4 lg:py-10 border-b lg:border-b-0 lg:border-r border-border/10 last:border-0">
              {/* Infinite Moving Marquee Ribbon at the top */}
              <div className="relative lg:absolute lg:top-6 lg:left-0 lg:right-0 w-full overflow-hidden py-3 border-y border-border/10 bg-card/10 backdrop-blur-sm pointer-events-none mb-8 lg:mb-0 mt-6 lg:mt-0">
                <div className="flex gap-6 animate-marquee whitespace-nowrap w-max">
                  {heroTiles.concat(heroTiles).map(({ icon: Icon, title, meta }, idx) => (
                    <div
                      key={`${title}-${idx}`}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/40 bg-background/40 shadow-sm text-xs font-semibold text-foreground/90"
                    >
                      <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                      <span>{title}</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                      <span className="text-[10px] text-muted-foreground font-medium">{meta}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating Hero Background Grid */}
              <div className="absolute inset-0 -z-10 opacity-20 pointer-events-none">
                <div className="parallax-layer parallax-slow absolute left-1/2 top-8 grid w-[920px] -translate-x-1/2 grid-cols-3 gap-4 opacity-35 blur-[0.2px] sm:opacity-50 lg:w-[1120px]">
                  {heroTiles.map(({ icon: Icon, title, meta, tone }, idx) => (
                    <div
                      key={title}
                      className={`min-h-32 rounded-xl border p-4 shadow-xl backdrop-blur-md transition-all duration-500 hover:scale-105 ${tone} ${idx % 2 ? 'translate-y-8' : ''}`}
                    >
                      <Icon className="mb-6 h-6 w-6 animate-pulse-soft" />
                      <p className="text-sm font-semibold text-foreground">{title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="container mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mt-4 sm:mt-8 w-full select-none">
                {/* Left Column */}
                <div className="lg:col-span-7 flex flex-col items-center text-center lg:items-start lg:text-left gap-4 sm:gap-6">
                  <Badge variant="outline" className="mb-2 inline-flex border-primary/30 bg-primary/10 px-3 py-1 text-primary shadow-glow-sm backdrop-blur">
                    <Zap className="mr-1.5 h-3.5 w-3.5" /> Live events near you
                  </Badge>
                  <h1 className="max-w-5xl text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl text-balance leading-[1.1] lg:leading-none">
                    Discover Local Events <span className="gradient-text">That Move You</span>
                  </h1>
                  
                  {/* Visual separation divider */}
                  <div className="my-2 h-[1px] w-24 bg-gradient-to-r from-transparent via-primary/50 to-transparent lg:from-primary/50 lg:to-transparent" aria-hidden="true" />

                  <p className="mx-auto lg:mx-0 max-w-2xl text-sm sm:text-base leading-relaxed text-muted-foreground/80 text-balance font-medium">
                    From marathons to meetups, cafe gatherings to community festivals, find and join
                    experiences that matter to you right in your neighborhood.
                  </p>

                  <div className="mt-4">
                    <HeroCTA />
                  </div>

                  <dl className="mt-6 sm:mt-10 grid w-full max-w-2xl grid-cols-1 sm:grid-cols-3 gap-4" aria-label="EventSphere statistics">
                    {stats.map(({ icon: Icon, value, label }, idx) => (
                      <div
                        key={label}
                        className="rounded-xl border border-border/40 bg-card/40 hover:border-primary/30 hover:shadow-glow-sm transition-all duration-300 px-6 py-4 text-left backdrop-blur-md"
                        style={{ animationDelay: `${idx * 80}ms` }}
                      >
                        <Icon className="mb-2 h-5 w-5 text-primary" aria-hidden="true" />
                        <dd className="text-2xl font-extrabold tracking-tight">{value}</dd>
                        <dt className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mt-1">{label}</dt>
                      </div>
                    ))}
                  </dl>
                </div>

                {/* Right Column: Stylized Overlapping Event Cards Stack */}
                <div className="lg:col-span-5 hidden lg:flex justify-center items-center relative h-[450px] w-full pointer-events-none">
                  {/* Card 3: Sports (Bottom) */}
                  <div className="absolute w-[260px] rounded-2xl border border-border/20 bg-card/30 backdrop-blur-sm p-4 flex flex-col gap-2 shadow-xl rotate-[8deg] translate-x-14 translate-y-8 opacity-40 hover:opacity-60 transition-opacity">
                    <div className="h-28 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-3xl">
                      🏃
                    </div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-orange-400 bg-orange-500/15 border border-orange-500/20 px-2 py-0.5 rounded-full self-start">Sports</span>
                    <h4 className="font-bold text-xs text-foreground/80 truncate">Sunrise Marathon</h4>
                    <p className="text-[10px] text-muted-foreground truncate">Sun, Jun 20 · 6:00 AM</p>
                    <p className="text-[10px] text-muted-foreground truncate">Riverfront, Ahmedabad</p>
                  </div>

                  {/* Card 2: Tech (Middle) */}
                  <div className="absolute w-[260px] rounded-2xl border border-border/30 bg-card/45 backdrop-blur-md p-4 flex flex-col gap-2 shadow-2xl rotate-[-6deg] -translate-x-14 -translate-y-4 opacity-75 hover:opacity-90 transition-opacity">
                    <div className="h-28 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-3xl">
                      💻
                    </div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-cyan-400 bg-cyan-500/15 border border-cyan-500/20 px-2 py-0.5 rounded-full self-start">Tech</span>
                    <h4 className="font-bold text-xs text-foreground/90 truncate">Ahmedabad Tech Summit</h4>
                    <p className="text-[10px] text-muted-foreground truncate">Mon, Jun 8 · 10:00 AM</p>
                    <p className="text-[10px] text-muted-foreground truncate">AMA Hall, Ahmedabad</p>
                  </div>

                  {/* Card 1: Music (Top/Front) */}
                  <div className="absolute w-[280px] rounded-2xl border border-primary/20 bg-card/75 backdrop-blur-xl p-5 flex flex-col gap-3 shadow-glow-primary rotate-[2deg] z-10 hover:scale-105 hover:rotate-0 transition-all duration-300 pointer-events-auto cursor-pointer select-none">
                    <div className="h-32 rounded-xl bg-gradient-to-br from-pink-500/20 to-violet-500/20 flex items-center justify-center text-4xl border border-border/10 relative overflow-hidden">
                      <span className="absolute top-2 left-2 rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wider font-extrabold bg-primary/20 border border-primary/30 text-primary animate-pulse">Upcoming</span>
                      🎵
                    </div>
                    <Badge variant="outline" className="self-start text-[10px] border-pink-500/30 text-pink-400 bg-pink-500/10">Music</Badge>
                    <h4 className="font-bold text-sm text-foreground">Indie Music Night</h4>
                    <p className="text-[11px] text-muted-foreground">Sat, Jun 14 · 7:30 PM</p>
                    <p className="text-[11px] text-muted-foreground truncate">City Amphitheater, Surat</p>
                    <div className="flex justify-between items-center mt-2 border-t border-border/20 pt-2 text-[11px]">
                      <span className="font-semibold text-primary">₹499</span>
                      <span className="text-muted-foreground font-medium">0 / 120 attending</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PANEL 2: FEATURED EVENTS SECTION */}
            <div className="w-full lg:w-[25%] h-auto lg:h-full flex flex-col justify-center shrink-0 py-4 lg:py-10 border-b lg:border-b-0 lg:border-r border-border/10 last:border-0">
              <div className="container mx-auto px-4 sm:px-8 flex flex-col gap-6 md:gap-8">
                {/* Panel Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary mb-2 shadow-glow-sm">
                      <Sparkles className="h-3 w-3 animate-pulse-soft" /> CURATED HIGHLIGHTS
                    </div>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
                      Featured <span className="gradient-text">Events</span>
                    </h2>
                    <p className="mt-1.5 text-sm md:text-base text-muted-foreground font-medium">
                      Handpicked experiences you won&apos;t want to miss in your neighborhood.
                    </p>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="self-start sm:self-auto group border border-border/40 hover:border-primary/30">
                    <Link href={ROUTES.DISCOVER}>
                      View all events
                      <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="w-full">
                        <EventCardSkeleton />
                      </div>
                    ))
                  ) : events.length === 0 ? (
                    <div className="col-span-full rounded-xl border border-dashed border-border/50 py-16 text-center">
                      <Compass className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">No events found — be the first to create one!</p>
                    </div>
                  ) : (
                    events.slice(0, 3).map((event, i) => (
                      <div
                        key={event.id}
                        className="w-full transition-transform duration-300 hover:-translate-y-1"
                      >
                        <EventCard event={event} index={i} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* PANEL 3: BROWSE BY CATEGORY SECTION */}
            <div className="w-full lg:w-[25%] h-auto lg:h-full flex flex-col justify-center shrink-0 py-4 lg:py-10 border-b lg:border-b-0 lg:border-r border-border/10 last:border-0">
              <div className="container mx-auto px-4 sm:px-8 flex flex-col gap-6 md:gap-8">
                {/* Panel Header */}
                <div className="flex flex-col gap-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 border border-secondary/20 px-3 py-1 text-xs font-semibold text-secondary-foreground mb-1">
                    <Zap className="h-3 w-3" /> FIND YOUR LANE
                  </div>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
                    Browse by <span className="gradient-text">Category</span>
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground font-medium">
                    Find events that match your interests. Select any block to filter.
                  </p>
                </div>

                {/* Category Groups Columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mx-auto">
                  {categoryGroups.map((group) => (
                    <div key={group.title} className="glass rounded-2xl p-5 border border-border/40 flex flex-col gap-4">
                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-border/20 pb-3">
                        <h3 className="font-bold text-sm tracking-wide text-foreground/90">{group.title}</h3>
                        <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full border ${group.color}`}>
                          {group.badge}
                        </span>
                      </div>
                      
                      {/* Items */}
                      <ul className="flex flex-col gap-2.5">
                        {group.items.map((cat) => (
                          <li key={cat.value}>
                            <button
                              onClick={() => handleCategoryClick(cat.value)}
                              className={cn(
                                'flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl border text-left text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-sm',
                                'bg-input/20 border-border/40 hover:border-primary/30 hover:bg-input/40 active:translate-y-px'
                              )}
                              aria-label={`Filter events by category: ${cat.label}`}
                              title={`Filter by ${cat.label}`}
                            >
                              <span className="text-xl" aria-hidden="true">{cat.emoji}</span>
                              <span className="flex-1 text-foreground/90">{cat.label}</span>
                              <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">Select →</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* PANEL 4: HOST YOUR OWN EVENT CTA */}
            <div className="w-full lg:w-[25%] h-auto lg:h-full flex flex-col justify-center shrink-0 py-4 lg:py-10 border-b lg:border-b-0 lg:border-r border-border/10 last:border-0 relative overflow-hidden">
              <div className="container mx-auto px-4 sm:px-8 flex justify-center">
                <div className="glass max-w-2xl rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center gap-6 border border-primary/20 shadow-glow-primary relative overflow-hidden">
                  <div className="absolute -top-24 -left-24 h-48 w-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-24 -right-24 h-48 w-48 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 shadow-glow-primary">
                    <Star className="h-6 w-6 text-primary animate-pulse" aria-hidden="true" />
                  </div>
                  <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                    Host Your Own <span className="gradient-text">Event</span>
                  </h2>
                  <p className="mx-auto max-w-xl text-sm sm:text-base leading-relaxed text-muted-foreground font-medium">
                    Become an organizer and bring your community together. Create events,
                    manage attendees, and grow your audience.
                  </p>

                  {/* Organizer Stats Pill */}
                  <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-full px-4 py-1.5 text-xs text-primary font-bold shadow-inner">
                    <Users className="h-3.5 w-3.5 animate-pulse-soft" aria-hidden="true" />
                    <span>Join 500+ local organizers hosting this week</span>
                  </div>

                  <div className="mt-2 scale-105">
                    <StartOrganizingButton />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
}
