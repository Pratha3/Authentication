'use client'
import { useEffect } from 'react'
import { subscribeToEventUpdates, unsubscribe } from '@/services/realtime/subscriptions'
import { useEventsStore } from '@/store/events.store'
import type { Event } from '@/types'

export function useRealtimeEvent(eventId: string) {
  const { updateEventAttendees, updateEventStatus } = useEventsStore()

  useEffect(() => {
    const channel = subscribeToEventUpdates(
      eventId,
      (count) => updateEventAttendees(eventId, count),
      (status) => updateEventStatus(eventId, status as Event['status'])
    )
    return () => unsubscribe(channel)
  }, [eventId, updateEventAttendees, updateEventStatus])
}
