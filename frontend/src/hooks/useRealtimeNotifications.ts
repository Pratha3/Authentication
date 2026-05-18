'use client'
import { useEffect, useRef } from 'react'
import { subscribeToUserNotifications } from '@/services/realtime/subscriptions'
import { useNotificationsStore } from '@/store/notifications.store'
import { useAuthStore } from '@/store/auth.store'
import { fetchNotifications } from '@/services/api/notifications.service'
import { toast } from 'sonner'
import type { Notification } from '@/types'

export function useRealtimeNotifications() {
  const { user } = useAuthStore()
  const { addNotification, setNotifications } = useNotificationsStore()
  // Track previous userId to avoid duplicate subscriptions
  const prevUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!user) {
      prevUserIdRef.current = null
      return
    }

    // Don't re-subscribe if same user is already subscribed
    if (prevUserIdRef.current === user.id) return
    prevUserIdRef.current = user.id

    // Load existing notifications from DB on login
    fetchNotifications(user.id).then(({ data }) => {
      if (data && data.length > 0) setNotifications(data)
    })

    // Subscribe to real-time push
    const unsubscribe = subscribeToUserNotifications(user.id, (raw) => {
      const notification = raw as Notification
      // Normalise _id → id from backend
      const normalised: Notification = {
        ...notification,
        id: (notification as any)._id ?? notification.id ?? '',
        is_read: (notification as any).isRead ?? notification.is_read ?? false,
        created_at: (notification as any).createdAt ?? notification.created_at ?? new Date().toISOString(),
      }
      addNotification(normalised)
      toast.info(normalised.title, {
        description: normalised.body,
        duration: 5000,
      })
    })

    return () => {
      unsubscribe()
      prevUserIdRef.current = null
    }
  }, [user?.id, addNotification, setNotifications])
}
