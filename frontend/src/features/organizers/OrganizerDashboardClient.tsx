'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, Users, CalendarDays, Eye, TrendingUp, Loader2, Pencil, Trash2, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth.store'
import { fetchOrganizerProfile } from '@/services/api/profiles.service'
import { fetchOrganizerEvents, updateEvent, deleteEvent } from '@/services/api/events.service'
import { fetchEventRegistrations } from '@/services/api/registrations.service'
import { AuthGuard } from '@/components/shared/AuthGuard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn, formatDateTime } from '@/lib/utils'
import { EVENT_STATUS_CONFIG, EVENT_CATEGORIES, ROUTES } from '@/constants'
import type { Event, EventStatus, Organizer } from '@/types'

const STATUSES: EventStatus[] = ['draft', 'upcoming', 'live', 'completed', 'cancelled']

const StatCard = ({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) => (
  <div className="rounded-xl border border-border/50 bg-card p-5 flex items-center gap-4">
    <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', color)}>
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  </div>
)

export function OrganizerDashboardClient() {
  const { user, profile } = useAuthStore()
  const [organizer, setOrganizer] = useState<Organizer | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('all')

  useEffect(() => {
    if (!user) return
    fetchOrganizerProfile(user.id).then(async ({ data: org }) => {
      setOrganizer(org)
      if (org) {
        const { data: evts } = await fetchOrganizerEvents(org.id)
        setEvents(evts ?? [])
      }
      setIsLoading(false)
    })
  }, [user])

  const handleStatusChange = async (id: string, status: EventStatus) => {
    const { error } = await updateEvent(id, { status })
    if (error) { toast.error(error); return }
    setEvents(prev => prev.map(e => e.id === id ? { ...e, status } : e))
    toast.success(`Status updated to ${status}`)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event? This cannot be undone.')) return
    const { error } = await deleteEvent(id)
    if (error) { toast.error(error); return }
    setEvents(prev => prev.filter(e => e.id !== id))
    toast.success('Event deleted')
  }

  const filteredEvents = statusFilter === 'all' ? events : events.filter(e => e.status === statusFilter)
  const totalAttendees = events.reduce((s, e) => s + e.current_attendees, 0)
  const totalViews = events.reduce((s, e) => s + (e.view_count ?? 0), 0)

  return (
    <AuthGuard requiredRole="organizer">
      <main className="container py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Organizer Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{organizer?.organization_name}</p>
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
              <StatCard label="Live Now" value={events.filter(e => e.status === 'live').length} icon={TrendingUp} color="bg-orange-500/15 text-orange-400" />
              <StatCard label="Total Views" value={totalViews} icon={Eye} color="bg-purple-500/15 text-purple-400" />
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
              {(['all', ...STATUSES] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs border transition-all capitalize',
                    statusFilter === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border/50 text-muted-foreground hover:border-border'
                  )}
                >
                  {s === 'all' ? `All (${events.length})` : `${s} (${events.filter(e => e.status === s).length})`}
                </button>
              ))}
            </div>

            {/* Events table */}
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
                      {['Event', 'Category', 'Date', 'Attendees', 'Status', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filteredEvents.map((event, i) => {
                      const cat = EVENT_CATEGORIES.find(c => c.value === event.category)
                      const status = EVENT_STATUS_CONFIG[event.status]
                      return (
                        <motion.tr
                          key={event.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.03 }}
                          className="hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium line-clamp-1 max-w-[200px]">{event.title}</p>
                            <p className="text-xs text-muted-foreground">{event.city ?? 'Online'}</p>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={cn('text-xs border', cat?.color)}>{cat?.emoji} {cat?.label}</Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDateTime(event.start_date)}</td>
                          <td className="px-4 py-3">
                            <span className="font-medium">{event.current_attendees}</span>
                            {event.capacity && <span className="text-muted-foreground">/{event.capacity}</span>}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={event.status}
                              onChange={(e) => handleStatusChange(event.id, e.target.value as EventStatus)}
                              className={cn('rounded-md border px-2 py-1 text-xs', status.color)}
                            >
                              {STATUSES.map(s => (
                                <option key={s} value={s}>{EVENT_STATUS_CONFIG[s].label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                <Link href={ROUTES.ORGANIZER.EDIT(event.id)}><Pencil className="h-3.5 w-3.5" /></Link>
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(event.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                <Link href={ROUTES.ORGANIZER.ATTENDEES(event.id)}><MoreHorizontal className="h-3.5 w-3.5" /></Link>
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
          </>
        )}
      </main>
    </AuthGuard>
  )
}
