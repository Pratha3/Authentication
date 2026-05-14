import { getSupabaseBrowserClient } from '@/services/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Event, Registration, Notification } from '@/types'

type EventPayload<T> = { new: T; old: T; eventType: 'INSERT' | 'UPDATE' | 'DELETE' }

export function subscribeToEventUpdates(
  eventId: string,
  onAttendeeChange: (count: number) => void,
  onStatusChange: (status: Event['status']) => void
): RealtimeChannel {
  const supabase = getSupabaseBrowserClient()
  return supabase
    .channel(`event-${eventId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'events', filter: `id=eq.${eventId}` },
      (payload) => {
        const updated = payload.new as Event
        if (updated.current_attendees !== undefined) onAttendeeChange(updated.current_attendees)
        if (updated.status !== undefined) onStatusChange(updated.status)
      }
    )
    .subscribe()
}

export function subscribeToRegistrations(
  eventId: string,
  onRegistration: (payload: EventPayload<Registration>) => void
): RealtimeChannel {
  const supabase = getSupabaseBrowserClient()
  return supabase
    .channel(`registrations-${eventId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'registrations', filter: `event_id=eq.${eventId}` },
      (payload) => onRegistration(payload as EventPayload<Registration>)
    )
    .subscribe()
}

export function subscribeToUserNotifications(
  userId: string,
  onNotification: (notification: Notification) => void
): RealtimeChannel {
  const supabase = getSupabaseBrowserClient()
  return supabase
    .channel(`notifications-${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      (payload) => onNotification(payload.new as Notification)
    )
    .subscribe()
}

export function subscribeToOrganizerDashboard(
  organizerId: string,
  onUpdate: () => void
): RealtimeChannel {
  const supabase = getSupabaseBrowserClient()
  return supabase
    .channel(`organizer-${organizerId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'registrations' },
      onUpdate
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'events' },
      onUpdate
    )
    .subscribe()
}

export function unsubscribe(channel: RealtimeChannel) {
  const supabase = getSupabaseBrowserClient()
  supabase.removeChannel(channel)
}
