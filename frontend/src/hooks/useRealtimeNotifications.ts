'use client'
import { useEffect } from 'react'
import { subscribeToUserNotifications, unsubscribe } from '@/services/realtime/subscriptions'
import { useNotificationsStore } from '@/store/notifications.store'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'

export function useRealtimeNotifications() {
  const { user } = useAuthStore()
  const { addNotification } = useNotificationsStore()

  useEffect(() => {
    if (!user) return
    const channel = subscribeToUserNotifications(user.id, (notification) => {
      addNotification(notification)
      toast.info(notification.title, { description: notification.body })
    })
    return () => unsubscribe(channel)
  }, [user, addNotification])
}
