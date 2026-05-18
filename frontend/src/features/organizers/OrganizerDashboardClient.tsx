'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Users, CalendarDays, Eye, TrendingUp, Loader2,
  Pencil, Trash2, CheckSquare, Activity, Wifi,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth.store'
import { fetchOrganizerProfile } from '@/services/api/profiles.service'
import { fetchOrganizerEvents, updateEvent, deleteEvent } from '@/services/api/events.service'
import { fetchEventRegistrations, checkInAttendee } from '@/services/api/registrations.service'
import { AuthGuard } from '@/components/shared/AuthGuard'
import { useOrganizerRealtime, type DashboardUpdate } from '@/hooks/useOrganizerRealtime'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn, formatDateTime } from '@/lib/utils'
import { EVENT_STATUS_CONFIG, EVENT_CATEGORIES, ROUTES } from '@/constants'
import type { Event, EventStatus, Organizer } from '@/types'

const STATUSES: EventStatus[] = ['draft', 'upcoming', 'live', 'completed', 'cancelled']

interface LiveFeedItem {
  id: string
  type: 'registration' | 'cancellation'
  name: string
  eventTitle?: string
  time: Date
}

const StatCard = ({ label, value, icon: Icon, color, pulse }: {
  label: string; value: string | number; icon: React.ElementType; color: string; pulse?: boolean
}) => (
  <div className="rounded-xl border border-border/50 bg-card p-5 flex items-center gap-4">
    <div className={cn('relative flex h-11 w-11 items-center justify-center rounded-xl', color)}>
      <Icon className="h-5 w-5" />
      {pulse && <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />}
    </div>
    <div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  </div>
)

function LiveFeed({ items }: { items: LiveFeedItem[] }) {
  if (items.length === 0) return null
  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40">
        <Activity className="h-4 w-4 text-green-400" />
        <span className="text-sm font-semibold">Live Activity</span>
        <span className="flex items-center gap-1 text-xs text-green-400 ml-auto">
          <Wifi className="h-3 w-3" /> Real-time
        </span>
      </div>
      <div className="divide-y divide-border/30 max-h-48 overflow-y-auto">
        <AnimatePresence initial={false}>
          {items.slice(0, 10).map(item => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 px-4 py-2.5"
            >
              <div className={cn(
                'h-2 w-2 rounded-full shrink-0',
                item.type === 'registration' ? 'bg-green-500' : 'bg-red-400'
              )} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">
                  {item.type === 'registration' ? '✅' : '❌'} {item.name}
                  {item.eventTitle && <span className="text-muted-foreground"> · {item.eventTitle}</span>}
                </p>
              </div>
              <span className="text-[11px] text-muted-foreground shrink-0">
                {item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

export function OrganizerDashboardClient() {
  const { user } = useAuthStore()
  const [organizer, setOrganizer] = useState<Organizer | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('all')
  const [liveFeed, setLiveFeed] = useState<LiveFeedItem[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [attendees, setAttendees] = useState<any[]>([])
  const [loadingAttendees, setLoadingAttendees] = useState(false)

  // Load organizer + events
  useEffect(() => {
    if (!user) return
    setIsLoading(true)
    fetchOrganizerProfile(user.id)
      .then(async ({ data: org, error }) => {
        if (error || !org) {
          toast.error('Could not load organizer profile.')
          return
        }
        setOrganizer(org)
        const { data: evts, error: evtErr } = await fetchOrganizerEvents(org.id)
        if (evtErr) toast.error(`Failed to load events: ${evtErr}`)
        setEvents(evts ?? [])
      })
      .finally(() => setIsLoading(false))
  }, [user])

  // Load attendees for selected event
  useEffect(() => {
    if (!selectedEventId) return
    setLoadingAttendees(true)
    fetchEventRegistrations(selectedEventId)
      .then(({ data }) => setAttendees(data ?? []))
      .finally(() => setLoadingAttendees(false))
  }, [selectedEventId])

  // Real-time dashboard updates
  const handleRealtimeUpdate = useCallback((update: DashboardUpdate) => {
    const newItem: LiveFeedItem = {
      id: `${Date.now()}-${Math.random()}`,
      type: update.type === 'new_registration' ? 'registration' : 'cancellation',
      name: update.attendeeName ?? 'Someone',
      time: new Date(),
    }
    setLiveFeed(prev => [newItem, ...prev].slice(0, 20))

    // Update attendee count in events list
    if (update.attendeeCount !== undefined) {
      setEvents(prev => prev.map(e =>
        e.id === update.eventId ? { ...e, current_attendees: update.attendeeCount! } : e
      ))
    }

    // Refresh attendee list if viewing that event
    if (selectedEventId === update.eventId) {
      fetchEventRegistrations(update.eventId).then(({ data }) => setAttendees(data ?? []))
    }
  }, [selectedEventId])

  useOrganizerRealtime(handleRealtimeUpdate)

  const handleStatusChange = async (id: string, status: EventStatus) => {
    const { error } = await updateEvent(id, { status })
    if (error) { toast.error(error); return }
    setEvents(prev => prev.map(e => e.id === id ? { ...e, status } : e))
    toast.success(`Status updated to "${status}"`)
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    const { error } = await deleteEvent(id)
    if (error) { toast.error(error); return }
    setEvents(prev => prev.filter(e => e.id !== id))
    if (selectedEventId === id) setSelectedEventId(null)
    toast.success('Event deleted')
  }

  const handleCheckIn = async (registrationId: string) => {
    const { data, error } = await checkInAttendee(registrationId)
    if (error) { toast.error(error); return }
    setAttendees(prev => prev.map((a: any) =>
      a.id === registrationId ? { ...a, checkedIn: (data as any)?.checkedIn } : a
    ))
    toast.success((data as any)?.checkedIn ? 'Checked in ✓' : 'Check-in removed')
  }

  const filteredEvents = statusFilter === 'all' ? events : events.filter(e => e.status === statusFilter)
  const totalAttendees = events.reduce((s, e) => s + (e.current_attendees ?? 0), 0)
  const totalViews = events.reduce((s, e) => s + (e.view_count ?? 0), 0)
  const liveCount = events.filter(e => e.status === 'live').length

  return (
    <AuthGuard requiredRole="organizer">
      <main className="container py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Organizer Dashboard</h1>
            {organizer && <p className="text-muted-foreground text-sm mt-0.5">{organizer.organization_name}</p>}
          </div>
          <Button asChild>
            <Link href={ROUTES.ORGANIZER.CREATE}><Plus className="mr-2 h-4 w-4" />Create Event</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total Events" value={events.length} icon={CalendarDays} color="bg-blue-500/15 text-blue-400" />
              <StatCard label="Total Attendees" value={totalAttendees} icon={Users} color="bg-green-500/15 text-green-400" />
              <StatCard label="Live Now" value={liveCount} icon={TrendingUp} color="bg-orange-500/15 text-orange-400" pulse={liveCount > 0} />
              <StatCard label="Total Views" value={totalViews} icon={Eye} color="bg-purple-500/15 text-purple-400" />
            </div>

            {/* Live activity feed */}
            <LiveFeed items={liveFeed} />

            {/* Status filter tabs */}
            <div className="flex gap-2 flex-wrap">
              {(['all', ...STATUSES] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs border transition-all capitalize',
                    statusFilter === s
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border/50 text-muted-foreground hover:border-border'
                  )}
                >
                  {s === 'all'
                    ? `All (${events.length})`
                    : `${s} (${events.filter(e => e.status === s).length})`}
                </button>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Events table */}
              <div className="lg:col-span-2">
                {filteredEvents.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/50 py-16 text-center">
                    <CalendarDays className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">No events found. <Link href={ROUTES.ORGANIZER.CREATE} className="text-primary hover:underline">Create one</Link></p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border/50 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="border-b border-border/50 bg-muted/40">
                        <tr>
                          {['Event', 'Date', 'Attendees', 'Status', 'Actions'].map(h => (
                            <th key={h} className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {filteredEvents.map((event, i) => {
                          const cat = EVENT_CATEGORIES.find(c => c.value === event.category)
                          const statusCfg = EVENT_STATUS_CONFIG[event.status]
                          const isSelected = selectedEventId === event.id
                          return (
                            <motion.tr
                              key={event.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: i * 0.02 }}
                              className={cn('transition-colors cursor-pointer', isSelected ? 'bg-primary/5' : 'hover:bg-muted/20')}
                              onClick={() => setSelectedEventId(isSelected ? null : event.id)}
                            >
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-base">{cat?.emoji}</span>
                                  <div>
                                    <p className="font-medium line-clamp-1 max-w-[140px] text-xs">{event.title}</p>
                                    <p className="text-[11px] text-muted-foreground">{event.city ?? 'Online'}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                {formatDateTime(event.start_date)}
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-1">
                                  <span className="font-semibold text-sm">{event.current_attendees}</span>
                                  {event.capacity && <span className="text-xs text-muted-foreground">/{event.capacity}</span>}
                                </div>
                              </td>
                              <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                                <select
                                  value={event.status}
                                  onChange={e => handleStatusChange(event.id, e.target.value as EventStatus)}
                                  className={cn('rounded-md border px-1.5 py-1 text-xs cursor-pointer', statusCfg.color)}
                                >
                                  {STATUSES.map(s => (
                                    <option key={s} value={s}>{EVENT_STATUS_CONFIG[s].label}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                    <Link href={ROUTES.ORGANIZER.EDIT(event.id)}><Pencil className="h-3.5 w-3.5" /></Link>
                                  </Button>
                                  <Button
                                    variant="ghost" size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={() => handleDelete(event.id, event.title)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </motion.tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Attendee panel (slides in when event selected) */}
              <AnimatePresence>
                {selectedEventId && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="rounded-xl border border-border/50 bg-card overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold">Attendees</span>
                        <Badge variant="secondary" className="text-xs">{attendees.length}</Badge>
                      </div>
                      <button onClick={() => setSelectedEventId(null)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
                    </div>

                    {loadingAttendees ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    ) : attendees.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">No attendees yet</div>
                    ) : (
                      <div className="divide-y divide-border/30 max-h-80 overflow-y-auto">
                        {attendees.map((a: any) => (
                          <div key={a.id} className="flex items-center gap-3 px-4 py-2.5">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{(a.user as any)?.name ?? (a.user as any)?.email ?? 'Attendee'}</p>
                              <p className="text-[11px] text-muted-foreground">{a.ticketCode} · {a.status}</p>
                            </div>
                            <button
                              onClick={() => handleCheckIn(a.id)}
                              className={cn(
                                'flex items-center gap-1 text-[11px] rounded-md px-2 py-1 transition-colors border',
                                a.checkedIn
                                  ? 'bg-green-500/15 text-green-400 border-green-500/30'
                                  : 'bg-muted text-muted-foreground border-border/50 hover:border-border'
                              )}
                            >
                              <CheckSquare className="h-3 w-3" />
                              {a.checkedIn ? 'In' : 'Check in'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </main>
    </AuthGuard>
  )
}
