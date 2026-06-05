'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { CalendarDays, MapPin, Ticket, Clock, CheckCircle2, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { fetchUserRegistrations, cancelRegistration } from '@/services/api/registrations.service'
import { useAuthStore } from '@/store/auth.store'
import { AuthGuard } from '@/components/shared/AuthGuard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn, formatDateTime } from '@/lib/utils'
import { EVENT_CATEGORIES, ROUTES } from '@/constants'

interface Registration {
  id: string
  status: 'confirmed' | 'waitlisted' | 'cancelled'
  ticketCode: string
  registeredAt: string
  checkedIn?: boolean
  event: {
    id?: string
    title?: string
    slug?: string
    bannerUrl?: string
    banner_url?: string
    startDate?: string
    start_date?: string
    city?: string
    status?: string
    category?: string
    isFree?: boolean
    is_free?: boolean
    price?: number
  } | null
}

const STATUS_STYLE = {
  confirmed: 'bg-green-500/15 text-green-400 border-green-500/30',
  waitlisted: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  cancelled: 'bg-muted/50 text-muted-foreground border-border',
}

export function MyRegistrationsClient() {
  const { user } = useAuthStore()
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [cancelling, setCancelling] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    fetchUserRegistrations(user.id).then(({ data }) => {
      setRegistrations((data as unknown as Registration[]) ?? [])
      setIsLoading(false)
    })
  }, [user])

  const handleCancel = async (reg: Registration) => {
    const eventId = reg.event?.id ?? ''
    if (!eventId || !user) return
    if (!confirm('Cancel your registration for this event?')) return
    setCancelling(reg.id)
    const { error } = await cancelRegistration(eventId, user.id)
    if (error) {
      toast.error(error)
    } else {
      setRegistrations(prev => prev.filter(r => r.id !== reg.id))
      toast.success('Registration cancelled')
    }
    setCancelling(null)
  }

  const upcoming = registrations.filter(r => r.status === 'confirmed')
  const waitlisted = registrations.filter(r => r.status === 'waitlisted')

  return (
    <AuthGuard>
      <main className="container max-w-3xl py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold">My Registrations</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {registrations.length === 0 ? 'No registrations yet' : `${upcoming.length} confirmed · ${waitlisted.length} waitlisted`}
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : registrations.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-24 text-center">
            <CalendarDays className="h-14 w-14 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold">No registrations yet</h3>
            <p className="text-muted-foreground text-sm mt-1 max-w-xs">Browse events and register to see them here.</p>
            <Button asChild className="mt-6">
              <Link href={ROUTES.DISCOVER}>Discover Events</Link>
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {registrations.map((reg, i) => {
              const ev = reg.event
              if (!ev) return null
              const cat = EVENT_CATEGORIES.find(c => c.value === ev.category)
              const startDate = ev.startDate ?? ev.start_date ?? ''
              const bannerUrl = ev.bannerUrl ?? ev.banner_url ?? null
              const slug = ev.slug ?? ''

              return (
                <motion.div
                  key={reg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    'rounded-xl border border-border/50 bg-card overflow-hidden transition-opacity',
                    reg.status === 'cancelled' && 'opacity-50'
                  )}
                >
                  <div className="flex flex-col sm:flex-row gap-0">
                    {/* Event thumbnail */}
                    <div className="relative w-full h-32 sm:w-28 sm:h-auto shrink-0 bg-muted animate-in fade-in">
                      {bannerUrl ? (
                        <Image src={bannerUrl} alt={ev.title ?? ''} fill className="object-cover" sizes="(max-width: 640px) 100vw, 112px" />
                      ) : (
                        <div className={cn('flex h-full min-h-[120px] sm:min-h-0 items-center justify-center text-3xl', cat?.color)}>
                          {cat?.emoji}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <Link
                            href={slug ? ROUTES.EVENT(slug) : '#'}
                            className="font-semibold hover:text-primary transition-colors line-clamp-1"
                          >
                            {ev.title}
                          </Link>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                            {startDate && (
                              <span className="flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />{formatDateTime(startDate)}
                              </span>
                            )}
                            {ev.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />{ev.city}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge className={cn('border text-xs shrink-0', STATUS_STYLE[reg.status])}>
                          {reg.status === 'confirmed' ? '✓ Confirmed'
                            : reg.status === 'waitlisted' ? '⏳ Waitlisted'
                            : 'Cancelled'}
                        </Badge>
                      </div>

                      {/* Ticket info */}
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 border border-border/50 px-2.5 py-1.5">
                          <Ticket className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-mono font-semibold tracking-wider">{reg.ticketCode}</span>
                        </div>

                        {reg.checkedIn && (
                          <div className="flex items-center gap-1 text-xs text-green-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />Checked in
                          </div>
                        )}

                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Registered {new Date(reg.registeredAt).toLocaleDateString()}
                        </span>

                        {reg.status === 'confirmed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-auto text-xs text-destructive hover:text-destructive h-7 px-2"
                            onClick={() => handleCancel(reg)}
                            disabled={cancelling === reg.id}
                          >
                            {cancelling === reg.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <><X className="h-3.5 w-3.5 mr-1" />Cancel</>}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </main>
    </AuthGuard>
  )
}
