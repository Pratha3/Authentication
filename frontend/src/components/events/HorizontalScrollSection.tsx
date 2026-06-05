'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { useFeaturedEvents } from '@/hooks/useEvents'
import { EventCard } from './EventCard'
import { EventCardSkeleton } from './EventCardSkeleton'
import { ROUTES } from '@/constants'
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

const bentoCategories = [
  { value: 'music', label: 'Music', emoji: '🎵', span: 'col-span-2 md:col-span-2', glow: 'from-pink-500/20 via-purple-500/5 to-transparent', hoverBorder: 'hover:border-pink-500/40', text: 'text-pink-400' },
  { value: 'tech', label: 'Tech', emoji: '💻', span: 'col-span-2 md:col-span-2', glow: 'from-cyan-500/20 via-blue-500/5 to-transparent', hoverBorder: 'hover:border-cyan-500/40', text: 'text-cyan-400' },
  { value: 'marathon', label: 'Marathon', emoji: '🏃', span: 'col-span-1', glow: 'from-orange-500/20 via-red-500/5 to-transparent', hoverBorder: 'hover:border-orange-500/40', text: 'text-orange-400' },
  { value: 'meetup', label: 'Meetup', emoji: '🤝', span: 'col-span-1', glow: 'from-blue-500/20 via-indigo-500/5 to-transparent', hoverBorder: 'hover:border-blue-500/40', text: 'text-blue-400' },
  { value: 'cafe', label: 'Café Event', emoji: '☕', span: 'col-span-1', glow: 'from-amber-500/20 via-yellow-500/5 to-transparent', hoverBorder: 'hover:border-amber-500/40', text: 'text-amber-400' },
  { value: 'club', label: 'Club', emoji: '🎶', span: 'col-span-1', glow: 'from-purple-500/20 via-fuchsia-500/5 to-transparent', hoverBorder: 'hover:border-purple-500/40', text: 'text-purple-400' },
  { value: 'community', label: 'Community', emoji: '🏘️', span: 'col-span-1', glow: 'from-green-500/20 via-emerald-500/5 to-transparent', hoverBorder: 'hover:border-green-500/40', text: 'text-green-400' },
  { value: 'sports', label: 'Sports', emoji: '⚽', span: 'col-span-1', glow: 'from-red-500/20 via-rose-500/5 to-transparent', hoverBorder: 'hover:border-red-500/40', text: 'text-red-400' },
  { value: 'food', label: 'Food', emoji: '🍕', span: 'col-span-1', glow: 'from-yellow-500/20 via-amber-500/5 to-transparent', hoverBorder: 'hover:border-yellow-500/40', text: 'text-yellow-400' },
  { value: 'art', label: 'Art', emoji: '🎨', span: 'col-span-1', glow: 'from-violet-500/20 via-fuchsia-500/5 to-transparent', hoverBorder: 'hover:border-violet-500/40', text: 'text-violet-400' },
  { value: 'outdoor', label: 'Outdoor', emoji: '🌲', span: 'col-span-2 md:col-span-2', glow: 'from-emerald-500/20 via-teal-500/5 to-transparent', hoverBorder: 'hover:border-emerald-500/40', text: 'text-emerald-400' },
  { value: 'wellness', label: 'Wellness', emoji: '🧘', span: 'col-span-1', glow: 'from-teal-500/20 via-cyan-500/5 to-transparent', hoverBorder: 'hover:border-teal-500/40', text: 'text-teal-400' },
  { value: 'business', label: 'Business', emoji: '💼', span: 'col-span-1', glow: 'from-slate-500/20 via-zinc-500/5 to-transparent', hoverBorder: 'hover:border-slate-500/40', text: 'text-slate-400' },
  { value: 'workshop', label: 'Workshop', emoji: '🔧', span: 'col-span-1', glow: 'from-indigo-500/20 via-blue-500/5 to-transparent', hoverBorder: 'hover:border-indigo-500/40', text: 'text-indigo-400' },
  { value: 'charity', label: 'Charity', emoji: '❤️', span: 'col-span-1', glow: 'from-rose-500/20 via-red-500/5 to-transparent', hoverBorder: 'hover:border-rose-500/40', text: 'text-rose-400' },
  { value: 'other', label: 'Other', emoji: '✨', span: 'col-span-2 md:col-span-2', glow: 'from-gray-500/20 via-slate-500/5 to-transparent', hoverBorder: 'hover:border-gray-500/40', text: 'text-gray-400' }
]

export function HorizontalScrollSection() {
  const targetRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { setFilters } = useEventsStore()
  const { events, isLoading } = useFeaturedEvents()
  const [isDesktop, setIsDesktop] = useState(false)
  const [hoveredStack, setHoveredStack] = useState(false)
  const [hostMousePosition, setHostMousePosition] = useState({ x: 0, y: 0 })

  const handleHostMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top } = e.currentTarget.getBoundingClientRect()
    setHostMousePosition({
      x: e.clientX - left,
      y: e.clientY - top,
    })
  }

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
                    {/* Stat 1: col-span-2 */}
                    <div
                      className="group/stat rounded-xl border border-border/40 bg-card/40 hover:border-primary/30 hover:shadow-glow-sm transition-all duration-300 px-6 py-4 text-left backdrop-blur-md relative overflow-hidden sm:col-span-2"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none group-hover/stat:bg-primary/10 transition-colors duration-500" />
                      <Zap className="mb-2 h-5 w-5 text-primary" aria-hidden="true" />
                      <dd className="text-2xl sm:text-3xl font-extrabold tracking-tight">10K+</dd>
                      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mt-1">Events listed</dt>
                    </div>

                    {/* Stat 2: col-span-1 */}
                    <div
                      className="group/stat rounded-xl border border-border/40 bg-card/40 hover:border-primary/30 hover:shadow-glow-sm transition-all duration-300 px-6 py-4 text-left backdrop-blur-md relative overflow-hidden sm:col-span-1"
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-secondary/5 rounded-full blur-xl pointer-events-none group-hover/stat:bg-secondary/10 transition-colors duration-500" />
                      <Users className="mb-2 h-5 w-5 text-secondary-foreground" aria-hidden="true" />
                      <dd className="text-2xl sm:text-3xl font-extrabold tracking-tight">50K+</dd>
                      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mt-1">Active users</dt>
                    </div>

                    {/* Stat 3: col-span-3 (Horizontal span banner) */}
                    <div
                      className="group/stat rounded-xl border border-border/40 bg-card/40 hover:border-primary/30 hover:shadow-glow-sm transition-all duration-300 px-6 py-4 text-left backdrop-blur-md relative overflow-hidden sm:col-span-3 flex items-center justify-between gap-4"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none opacity-50 group-hover/stat:opacity-100 transition-opacity" />
                      <div className="relative z-10 flex flex-col">
                        <dd className="text-2xl sm:text-3xl font-extrabold tracking-tight">100+</dd>
                        <dt className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mt-1">Cities covered</dt>
                      </div>
                      <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                        <Map className="h-5 w-5 text-primary" aria-hidden="true" />
                      </div>
                    </div>
                  </dl>
                </div>

                {/* Right Column: Stylized Overlapping Event Cards Stack */}
                <div
                  className="lg:col-span-5 hidden lg:flex justify-center items-center relative h-[450px] w-full pointer-events-auto cursor-pointer"
                  onMouseEnter={() => setHoveredStack(true)}
                  onMouseLeave={() => setHoveredStack(false)}
                >
                  {/* Card 3: Sports (Bottom) */}
                  <motion.div
                    animate={{
                      x: hoveredStack ? 96 : 56,
                      y: hoveredStack ? 64 : 32,
                      rotate: hoveredStack ? 15 : 8,
                      opacity: hoveredStack ? 0.8 : 0.4,
                    }}
                    transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                    className="absolute w-[260px] rounded-2xl border border-border/20 bg-card/30 backdrop-blur-sm p-4 flex flex-col gap-2 shadow-xl"
                  >
                    <div className="h-28 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-3xl">
                      🏃
                    </div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-orange-400 bg-orange-500/15 border border-orange-500/20 px-2 py-0.5 rounded-full self-start">Sports</span>
                    <h4 className="font-bold text-xs text-foreground/80 truncate">Sunrise Marathon</h4>
                    <p className="text-[10px] text-muted-foreground truncate">Sun, Jun 20 · 6:00 AM</p>
                    <p className="text-[10px] text-muted-foreground truncate">Riverfront, Ahmedabad</p>
                  </motion.div>

                  {/* Card 2: Tech (Middle) */}
                  <motion.div
                    animate={{
                      x: hoveredStack ? -112 : -56,
                      y: hoveredStack ? -32 : -16,
                      rotate: hoveredStack ? -15 : -6,
                      opacity: hoveredStack ? 0.95 : 0.75,
                    }}
                    transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                    className="absolute w-[260px] rounded-2xl border border-border/30 bg-card/45 backdrop-blur-md p-4 flex flex-col gap-2 shadow-2xl"
                  >
                    <div className="h-28 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-3xl">
                      💻
                    </div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-cyan-400 bg-cyan-500/15 border border-cyan-500/20 px-2 py-0.5 rounded-full self-start">Tech</span>
                    <h4 className="font-bold text-xs text-foreground/90 truncate">Ahmedabad Tech Summit</h4>
                    <p className="text-[10px] text-muted-foreground truncate">Mon, Jun 8 · 10:00 AM</p>
                    <p className="text-[10px] text-muted-foreground truncate">AMA Hall, Ahmedabad</p>
                  </motion.div>

                  {/* Card 1: Music (Top/Front) */}
                  <motion.div
                    animate={{
                      y: hoveredStack ? -12 : 0,
                      rotate: hoveredStack ? 0 : 2,
                      scale: hoveredStack ? 1.05 : 1,
                    }}
                    transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                    className="absolute w-[280px] rounded-2xl border border-primary/20 bg-card/75 backdrop-blur-xl p-5 flex flex-col gap-3 shadow-glow-primary z-10 select-none"
                  >
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
                  </motion.div>
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

                {/* Categories Bento Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-5xl mx-auto">
                  {bentoCategories.map((cat) => (
                    <motion.button
                      key={cat.value}
                      onClick={() => handleCategoryClick(cat.value)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "group relative flex flex-col justify-end p-5 h-28 rounded-2xl border bg-card/45 backdrop-blur-md transition-all duration-300 text-left overflow-hidden cursor-pointer",
                        "border-border/30 hover:shadow-lg",
                        cat.hoverBorder,
                        cat.span
                      )}
                      aria-label={`Filter events by category: ${cat.label}`}
                      title={`Filter by ${cat.label}`}
                    >
                      {/* Custom glow background */}
                      <div className={cn("absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br pointer-events-none z-0", cat.glow)} />
                      
                      {/* Float backdrop emoji */}
                      <span className="absolute right-4 bottom-2 text-5xl opacity-10 pointer-events-none transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12 select-none z-0">
                        {cat.emoji}
                      </span>

                      {/* Content */}
                      <div className="relative z-10 flex flex-col gap-1">
                        <span className="text-2xl" aria-hidden="true">{cat.emoji}</span>
                        <span className={cn("font-bold text-sm tracking-wide text-foreground/90 group-hover:text-foreground transition-colors", cat.text)}>
                          {cat.label}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* PANEL 4: HOST YOUR OWN EVENT CTA */}
            <div className="w-full lg:w-[25%] h-auto lg:h-full flex flex-col justify-center shrink-0 py-4 lg:py-10 border-b lg:border-b-0 lg:border-r border-border/10 last:border-0 relative overflow-hidden">
              <div className="container mx-auto px-4 sm:px-8 flex justify-center">
                <div
                  onMouseMove={handleHostMouseMove}
                  className="group/host glass max-w-2xl rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center gap-6 border border-primary/20 shadow-glow-primary relative overflow-hidden"
                >
                  {/* Dynamic spotlight gradients */}
                  <div
                    className="absolute -inset-px rounded-3xl opacity-0 group-hover/host:opacity-100 transition-opacity duration-500 pointer-events-none z-0"
                    style={{
                      background: `radial-gradient(250px circle at ${hostMousePosition.x}px ${hostMousePosition.y}px, color-mix(in oklch, var(--primary) 20%, transparent), color-mix(in oklch, var(--secondary) 15%, transparent) 50%, transparent 100%)`,
                    }}
                  />
                  <div
                    className="absolute -inset-px rounded-3xl opacity-0 group-hover/host:opacity-100 transition-opacity duration-500 pointer-events-none z-30"
                    style={{
                      background: `radial-gradient(150px circle at ${hostMousePosition.x}px ${hostMousePosition.y}px, color-mix(in oklch, var(--primary) 40%, var(--secondary)), transparent 80%)`,
                      padding: '1px',
                      maskImage: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      WebkitMaskImage: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      maskComposite: 'exclude',
                      WebkitMaskComposite: 'xor',
                    }}
                  />

                  <div className="absolute -top-24 -left-24 h-48 w-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-24 -right-24 h-48 w-48 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 shadow-glow-primary">
                    <Star className="h-6 w-6 text-primary animate-pulse" aria-hidden="true" />
                  </div>
                  <h2 className="relative z-10 text-4xl sm:text-5xl font-extrabold tracking-tight">
                    Host Your Own <span className="gradient-text">Event</span>
                  </h2>
                  <p className="relative z-10 mx-auto max-w-xl text-sm sm:text-base leading-relaxed text-muted-foreground font-medium">
                    Become an organizer and bring your community together. Create events,
                    manage attendees, and grow your audience.
                  </p>

                  {/* Organizer Stats Pill */}
                  <div className="relative z-10 inline-flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-full px-4 py-1.5 text-xs text-primary font-bold shadow-inner">
                    <Users className="h-3.5 w-3.5 animate-pulse-soft" aria-hidden="true" />
                    <span>Join 500+ local organizers hosting this week</span>
                  </div>

                  <div className="relative z-10 mt-2 scale-105">
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
