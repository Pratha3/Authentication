'use client'
import { useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { authApi, profilesApi, getToken, clearToken } from '@/lib/api'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/constants'
import type { Profile } from '@/types'

export function useAuth() {
  const {
    user, profile, token, isLoading, isInitialized,
    setUser, setProfile, setToken, setLoading, setInitialized,
  } = useAuthStore()

  useEffect(() => {
    if (isInitialized) return

    const storedToken = getToken()
    if (!storedToken) {
      setLoading(false)
      setInitialized(true)
      return
    }

    // Rehydrate session from stored JWT
    authApi.getMe()
      .then(async ({ user: me }) => {
        setUser(me)
        setToken(storedToken)
        // Fetch full profile
        try {
          const { data } = await profilesApi.get(me.id) as { data: Profile | null }
          setProfile(data)
        } catch {
          // Profile fetch failure is non-fatal
        }
      })
      .catch(() => {
        // Token expired or invalid — clear it
        clearToken()
        setToken(null)
        setUser(null)
      })
      .finally(() => {
        setLoading(false)
        setInitialized(true)
      })
  }, [isInitialized, setUser, setProfile, setToken, setLoading, setInitialized])

  return { user, profile, token, isLoading, isAuthenticated: !!user && !!token }
}

export function useSignOut() {
  const router = useRouter()
  const signOut = useAuthStore((s) => s.signOut)

  return useCallback(() => {
    signOut()
    toast.success('Signed out successfully')
    router.push(ROUTES.HOME)
  }, [router, signOut])
}
