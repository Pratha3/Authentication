'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Bookmark, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useBookmarksStore } from '@/store/bookmarks.store'
import { fetchUserBookmarks } from '@/services/api/bookmarks.service'
import { AuthGuard } from '@/components/shared/AuthGuard'
import { EventCard } from '@/components/events/EventCard'
import { EventCardSkeleton } from '@/components/events/EventCardSkeleton'
import type { Event } from '@/types'

export function BookmarksClient() {
  const { user } = useAuthStore()
  const { setBookmarks } = useBookmarksStore()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchUserBookmarks(user.id).then(({ data }) => {
      const evts = (data ?? []).map(b => b.event).filter(Boolean) as Event[]
      setEvents(evts)
      setBookmarks(data ?? [])
      setIsLoading(false)
    })
  }, [user, setBookmarks])

  return (
    <AuthGuard>
      <main className="container py-8 space-y-6">
        <h1 className="text-2xl font-bold">Saved Events</h1>

        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <EventCardSkeleton key={i} />)}
          </div>
        ) : events.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 text-center">
            <Bookmark className="h-14 w-14 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold">No saved events yet</h3>
            <p className="text-muted-foreground text-sm mt-1">Events you bookmark will appear here.</p>
          </motion.div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event, i) => (
              <EventCard key={event.id} event={{ ...event, is_bookmarked: true }} index={i} />
            ))}
          </div>
        )}
      </main>
    </AuthGuard>
  )
}
