'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants'
import { createOrganizerProfile, fetchOrganizerProfile, fetchProfile } from '@/services/api/profiles.service'
import { useAuthStore } from '@/store/auth.store'

export function StartOrganizingButton() {
  const router = useRouter()
  const { user, profile, isInitialized, setProfile } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    if (!isInitialized) return

    if (!user) {
      router.push(`${ROUTES.SIGNUP}?next=${encodeURIComponent(ROUTES.ORGANIZER.CREATE)}`)
      return
    }

    if (profile?.role === 'organizer' || profile?.role === 'admin') {
      router.push(ROUTES.ORGANIZER.CREATE)
      return
    }

    setIsLoading(true)
    try {
      const existing = await fetchOrganizerProfile(user.id)
      if (!existing.data) {
        const organizationName = profile?.full_name || user.name || user.email.split('@')[0] || 'My Organization'
        const created = await createOrganizerProfile({
          user_id: user.id,
          organization_name: organizationName,
          description: null,
          logo_url: null,
          website: null,
          social_links: null,
          verification_status: 'pending',
          verified_at: null,
        })

        if (created.error) {
          toast.error(created.error)
          return
        }
      }

      const refreshed = await fetchProfile(user.id)
      if (refreshed.data) setProfile(refreshed.data)
      router.push(ROUTES.ORGANIZER.CREATE)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button type="button" size="lg" onClick={handleClick} disabled={!isInitialized || isLoading}>
      {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Starting...</> : 'Start Organizing'}
    </Button>
  )
}
