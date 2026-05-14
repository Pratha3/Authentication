'use client'
import { useEffect } from 'react'
import { subscribeToEventUpdates } from '@/services/realtime/subscriptions'
import { useEventsStore } from '@/store/events.store'

export function useRealtimeEvent(eventId: string) {
  const { updateEventAttendees, updateEventStatus } = useEventsStore()

  useEffect(() => {
    const unsubscribe = subscribeToEventUpdates(
      eventId,
      (count) => updateEventAttendees(eventId, count),
      (status) => updateEventStatus(eventId, status as Parameters<typeof updateEventStatus>[1])
    )
    return unsubscribe
  }, [eventId, updateEventAttendees, updateEventStatus])
}
