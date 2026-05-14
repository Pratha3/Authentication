'use client'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, CheckCheck } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useNotificationsStore } from '@/store/notifications.store'
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '@/services/api/notifications.service'
import { AuthGuard } from '@/components/shared/AuthGuard'
import { Button } from '@/components/ui/button'
import { cn, formatRelativeTime } from '@/lib/utils'

const TYPE_COLORS: Record<string, string> = {
  event_update: 'bg-blue-500',
  registration: 'bg-green-500',
  reminder: 'bg-yellow-500',
  system: 'bg-gray-500',
  organizer: 'bg-purple-500',
}

export function NotificationsClient() {
  const { user } = useAuthStore()
  const { notifications, setNotifications, markAsRead, markAllAsRead, unreadCount } = useNotificationsStore()

  useEffect(() => {
    if (!user) return
    fetchNotifications(user.id).then(({ data }) => {
      if (data) setNotifications(data)
    })
  }, [user, setNotifications])

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
    <AuthGuard>
      <main className="container max-w-2xl py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="gap-2 text-muted-foreground">
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-24 text-center">
            <Bell className="h-14 w-14 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold">All caught up!</h3>
            <p className="text-muted-foreground text-sm mt-1">No notifications yet.</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => !n.is_read && handleMarkRead(n.id)}
                className={cn(
                  'flex gap-3 rounded-xl border p-4 cursor-pointer transition-colors',
                  n.is_read ? 'border-border/40 bg-card/40' : 'border-border bg-card hover:bg-accent/30'
                )}
              >
                <div className={cn('mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full', TYPE_COLORS[n.type] ?? 'bg-gray-500', n.is_read && 'opacity-30')} />
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium', n.is_read && 'text-muted-foreground')}>{n.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">{formatRelativeTime(n.created_at)}</p>
                </div>
                {!n.is_read && <div className="h-2 w-2 shrink-0 rounded-full bg-primary mt-1.5" />}
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </AuthGuard>
  )
}
