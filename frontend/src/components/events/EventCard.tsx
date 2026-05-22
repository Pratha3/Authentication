'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, MapPin, Users, Bookmark, BookmarkCheck } from 'lucide-react'
import { cn, formatDateTime, formatCurrency, truncate, formatDistance, getCapacityPercentage } from '@/lib/utils'
import { EVENT_CATEGORIES, EVENT_STATUS_CONFIG, ROUTES } from '@/constants'
import { useBookmark } from '@/hooks/useBookmark'
import { Badge } from '@/components/ui/badge'
import type { Event } from '@/types'

interface EventCardProps {
  event: Event
  index?: number
  variant?: 'default' | 'compact' | 'featured'
}

export function EventCard({ event, index = 0, variant = 'default' }: EventCardProps) {
  const { bookmarked, toggleBookmark } = useBookmark(event.id)
  const categoryConfig = EVENT_CATEGORIES.find(c => c.value === event.category)
  const statusConfig = EVENT_STATUS_CONFIG[event.status]
  const capacityPct = getCapacityPercentage(event.capacity, event.current_attendees)
  const isFull = event.capacity !== null && event.current_attendees >= event.capacity

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm transition-all duration-300',
        'hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1',
        variant === 'featured' && 'md:flex-row md:h-64'
      )}
    >
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
          <div className={cn('flex h-full items-center justify-center text-4xl', categoryConfig?.color ?? 'bg-muted')}>
            {categoryConfig?.emoji}
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <Badge className={cn('text-xs border', statusConfig.color)}>{statusConfig.label}</Badge>
        </div>

        {/* Bookmark */}
        <button
          onClick={(e) => { e.preventDefault(); toggleBookmark() }}
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm transition-all hover:bg-background hover:scale-110"
          aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark event'}
        >
          {bookmarked
            ? <BookmarkCheck className="h-4 w-4 text-primary" />
            : <Bookmark className="h-4 w-4 text-muted-foreground" />
          }
        </button>

        {/* Distance */}
        {event.distance !== undefined && (
          <div className="absolute bottom-3 right-3 rounded-full bg-background/80 backdrop-blur-sm px-2 py-0.5 text-xs font-medium">
            {formatDistance(event.distance)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4 gap-3">
        {/* Category */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn('text-xs border', categoryConfig?.color)}>
            {categoryConfig?.emoji} {categoryConfig?.label}
          </Badge>
          {event.is_free ? (
            <Badge variant="outline" className="text-xs border-green-500/30 text-green-400 bg-green-500/10">Free</Badge>
          ) : (
            <span className="ml-auto text-sm font-semibold">{formatCurrency(event.price, event.currency)}</span>
          )}
        </div>

        {/* Title */}
        <Link href={ROUTES.EVENT(event.slug)} className="block">
          <h3 className="font-semibold leading-tight hover:text-primary transition-colors line-clamp-2">
            {event.title}
          </h3>
        </Link>

        {/* Meta */}
        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground mt-auto">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>{formatDateTime(event.start_date)}</span>
          </div>
          {(event.city || event.venue?.name) && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{event.venue?.name ?? event.city}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span>{event.current_attendees} attending</span>
            {event.capacity && (
              <span className="text-muted-foreground/70">/ {event.capacity}</span>
            )}
            {isFull && <Badge variant="outline" className="text-xs ml-auto border-destructive/30 text-destructive bg-destructive/10">Full</Badge>}
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
