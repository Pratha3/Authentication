'use client'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, CheckCheck, Dot } from 'lucide-react'
import Link from 'next/link'
import { useNotificationsStore } from '@/store/notifications.store'
import { useAuthStore } from '@/store/auth.store'
import { markNotificationRead, markAllNotificationsRead } from '@/services/api/notifications.service'
import { cn, formatRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// useRealtimeNotifications (in providers.tsx) already loads notifications into the
// store on login and subscribes to real-time pushes. This component just reads from
// that store — no duplicate fetch needed.

const TYPE_DOT: Record<string, string> = {
  registration: 'bg-green-500',
  organizer: 'bg-purple-500',
  event_update: 'bg-blue-500',
  reminder: 'bg-yellow-500',
  system: 'bg-muted-foreground',
}

export function NotificationDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { user } = useAuthStore()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationsStore()

  // Click-outside close & Hotkey Alt+T
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
    }
    document.addEventListener('mousedown', handler)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handler)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleMarkRead = async (id: string) => {
    markAsRead(id)
    await markNotificationRead(id)
  }

  const handleMarkAllRead = async () => {
    if (!user) return
    markAllAsRead()
    await markAllNotificationsRead(user.id)
  }

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="relative"
        aria-label="Notifications"
        title="Notifications (Alt+T)"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </Button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border/50 bg-card shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-xs bg-primary/15 text-primary rounded-full px-1.5 py-0.5 font-medium">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[360px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && handleMarkRead(n.id)}
                    className={cn(
                      'flex gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-border/30 last:border-0',
                      n.is_read ? 'opacity-60 hover:opacity-80' : 'bg-primary/5 hover:bg-primary/10'
                    )}
                  >
                    <div className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', TYPE_DOT[n.type] ?? 'bg-muted-foreground')} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight line-clamp-1">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-[11px] text-muted-foreground/60 mt-1">{formatRelativeTime(n.created_at)}</p>
                    </div>
                    {!n.is_read && <Dot className="h-5 w-5 text-primary shrink-0" />}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border/50 px-4 py-2.5">
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="block text-center text-xs text-primary hover:underline"
              >
                View all notifications →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
