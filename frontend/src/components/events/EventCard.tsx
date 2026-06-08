'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, MapPin, Users, Bookmark, BookmarkCheck } from 'lucide-react'
import { cn, formatDateTime, formatCurrency, formatDistance, getCapacityPercentage } from '@/lib/utils'
import { EVENT_CATEGORIES, EVENT_STATUS_CONFIG, ROUTES } from '@/constants'
import { useBookmark } from '@/hooks/useBookmark'
import { Badge } from '@/components/ui/badge'
import { CategoryIcon } from './CategoryIcon'
import type { Event } from '@/types'

interface EventCardProps {
  event: Event
  index?: number
  variant?: 'default' | 'compact' | 'featured'
}

export function EventCard({ event, index = 0, variant = 'default' }: EventCardProps) {
  const { bookmarked, toggleBookmark } = useBookmark(event.id, !!event.is_bookmarked)
  const categoryConfig = EVENT_CATEGORIES.find(c => c.value === event.category)
  const statusConfig = EVENT_STATUS_CONFIG[event.status]
  const capacityPct = getCapacityPercentage(event.capacity, event.current_attendees)
  const isFull = event.capacity !== null && event.current_attendees >= event.capacity

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const { left, top } = e.currentTarget.getBoundingClientRect()
    setMousePosition({
      x: e.clientX - left,
      y: e.clientY - top,
    })
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onMouseMove={handleMouseMove}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-border/30 bg-card/45 backdrop-blur-md transition-all duration-500',
        'hover:-translate-y-1',
        variant === 'featured' && 'md:flex-row md:h-64'
      )}
    >
      {/* 21st.dev inspired spotlight border and diffuse neon shadow */}
      <div
        className="absolute -inset-px rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-30"
        style={{
          background: `radial-gradient(120px circle at ${mousePosition.x}px ${mousePosition.y}px, color-mix(in oklch, var(--primary) 50%, var(--secondary)), transparent 80%)`,
          maskImage: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskImage: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
          padding: '1px',
        }}
      />
      <div
        className="absolute -inset-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl pointer-events-none -z-10"
        style={{
          background: `radial-gradient(300px circle at ${mousePosition.x}px ${mousePosition.y}px, color-mix(in oklch, var(--primary) 15%, transparent), color-mix(in oklch, var(--secondary) 10%, transparent) 50%, transparent 100%)`,
        }}
      />
      {/* Banner */}
      <div className={cn(
        'relative overflow-hidden bg-muted',
        variant === 'featured' ? 'md:w-2/5 h-48 md:h-full' : 'h-48'
      )}>
        {event.banner_url ? (
          <Image
            src={event.banner_url}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className={cn('flex h-full items-center justify-center', categoryConfig?.color ?? 'bg-muted')} aria-hidden="true">
            <CategoryIcon category={event.category} className="h-12 w-12 text-foreground/75" />
          </div>
        )}

        {/* Top Badges & Actions row */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-none">
          <Badge className={cn('text-[10px] sm:text-xs border shadow-sm backdrop-blur-md bg-background/70 font-semibold pointer-events-auto', statusConfig.color)}>
            {statusConfig.label}
          </Badge>
          
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleBookmark() }}
            className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm transition-all hover:bg-background hover:scale-110 border border-border/20 shadow-sm cursor-pointer"
            aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark event'}
            title={bookmarked ? 'Remove bookmark' : 'Bookmark event'}
          >
            {bookmarked
              ? <BookmarkCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              : <Bookmark className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            }
          </button>
        </div>

        {/* Distance */}
        {event.distance !== undefined && (
          <div className="absolute bottom-3 right-3 rounded-full bg-background/80 backdrop-blur-sm px-2 py-0.5 text-xs font-medium z-20">
            {formatDistance(event.distance)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4 gap-3">
        {/* Category */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn('text-xs border gap-1.5', categoryConfig?.color)}>
            <CategoryIcon category={event.category} className="h-3.5 w-3.5" /> {categoryConfig?.label}
          </Badge>
          {event.is_free ? (
            <Badge variant="outline" className="text-xs border-green-500/30 text-green-400 bg-green-500/10">Free</Badge>
          ) : (
            <span className="ml-auto text-sm font-semibold">{formatCurrency(event.price, event.currency)}</span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2">
          <Link href={ROUTES.EVENT(event.slug)} className="hover:underline before:absolute before:inset-0 before:z-10">
            {event.title}
          </Link>
        </h3>

        {/* Meta */}
        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground mt-auto">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{formatDateTime(event.start_date)}</span>
          </div>
          {(event.city || event.venue?.name) && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{event.venue?.name ?? event.city}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-auto">
            <Users className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
            <span className="truncate">
              {event.current_attendees} attending {event.capacity ? `(max ${event.capacity})` : ''}
            </span>
            {isFull && <Badge variant="outline" className="text-[10px] ml-auto h-5 px-1.5 border-destructive/30 text-destructive bg-destructive/10">Full</Badge>}
          </div>
        </div>

        {/* Capacity bar */}
        {event.capacity && capacityPct > 0 && (
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', capacityPct > 80 ? 'bg-orange-500' : 'bg-primary')}
              style={{ width: `${capacityPct}%` }}
            />
          </div>
        )}
      </div>
    </motion.article>
  )
}
