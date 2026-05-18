'use client'
import { useEffect, useCallback } from 'react'
import { subscribeToOrganizerDashboard, type OrganizerDashboardUpdate } from '@/services/realtime/subscriptions'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'

export type { OrganizerDashboardUpdate as DashboardUpdate }

export function useOrganizerRealtime(onUpdate: (update: OrganizerDashboardUpdate) => void) {
  const { user } = useAuthStore()
  // Memoize so useEffect deps are stable
  const stableOnUpdate = useCallback(onUpdate, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user) return

    const unsubscribe = subscribeToOrganizerDashboard(user.id, (data) => {
      stableOnUpdate(data)
      if (data.type === 'new_registration') {
        toast.success('New registration!', {
          description: `${data.attendeeName ?? 'Someone'} just signed up`,
          duration: 4000,
        })
      }
    })

    return unsubscribe
  }, [user, stableOnUpdate])
}
