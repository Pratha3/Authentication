import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Zap, Users, Map, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/layout/Navbar'
import * as motion from 'framer-motion/client'
import { FeaturedEventsSection } from '@/components/events/FeaturedEventsSection'
import { CategoryGrid } from '@/components/events/CategoryGrid'
import { HeroCTA } from '@/components/shared/HeroCTA'
import { StartOrganizingButton } from '@/components/shared/StartOrganizingButton'
import { ROUTES } from '@/constants'

export const metadata: Metadata = {
  title: 'EventSphere — Discover Local Events Near You',
}

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main className="flex flex-col">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden section-gradient">
          <div className="container py-24 md:py-36 text-center">
            <Badge variant="outline" className="mb-6 border-primary/30 text-primary bg-primary/10 inline-flex">
              <Zap className="mr-1 h-3 w-3" /> Live events near you
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl text-balance mb-6">
              <span className="block">Discover Events That</span>
              <span className="gradient-text block">Move You</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-8 text-balance">
              From marathons to meetups, café gatherings to community festivals — find and join
              experiences that matter to you, happening right in your neighborhood.
            </p>

            {/* Auth-aware CTA — shows Explore + Create Account for guests,
                Explore + Dashboard/Create Event for logged-in users */}
            <HeroCTA />

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-16 grid grid-cols-3 gap-4 max-w-lg mx-auto"
            >
              {[
                { icon: Zap, value: '10K+', label: 'Events Listed' },
                { icon: Users, value: '50K+', label: 'Active Users' },
                { icon: Map, value: '100+', label: 'Cities' },
              ].map(({ icon: Icon, value, label }, idx) => (
                <motion.div 
                  key={label} 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="rounded-xl border border-border/50 bg-card/50 p-4 glass glow transition-all"
                >
                  <Icon className="h-5 w-5 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── Featured Events ── */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="container py-16"
        >
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
        </motion.section>

        {/* ── Categories ── */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="container py-8 pb-16"
        >
          <div className="mb-8">
            <h2 className="text-2xl font-bold">Browse by Category</h2>
            <p className="text-muted-foreground text-sm mt-1">Find events that match your interests</p>
          </div>
          <CategoryGrid />
        </motion.section>

        {/* ── Organizer CTA ── */}
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="border-t border-border/40 bg-card/30"
        >
          <div className="container py-16 text-center">
            <Star className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Host Your Own Event</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Become an organizer and bring your community together. Create events,
              manage attendees, and grow your audience.
            </p>
            <StartOrganizingButton />
          </div>
        </motion.section>
      </main>
    </>
  )
}
