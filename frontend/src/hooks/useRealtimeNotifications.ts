'use client'
import { useEffect } from 'react'
import { subscribeToUserNotifications } from '@/services/realtime/subscriptions'
import { useNotificationsStore } from '@/store/notifications.store'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'
import type { Notification } from '@/types'

export function useRealtimeNotifications() {
  const { user } = useAuthStore()
  const { addNotification } = useNotificationsStore()

  useEffect(() => {
    if (!user) return
    const unsubscribe = subscribeToUserNotifications(user.id, (raw) => {
      const notification = raw as Notification
      addNotification(notification)
      toast.info(notification.title, { description: notification.body })
    })
    return unsubscribe
  }, [user, addNotification])
}
