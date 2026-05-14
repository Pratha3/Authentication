import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Profile, UserRole } from '@/types'

// ─── JWT-based auth user (from our Express backend) ───────────────────────────
export interface AuthUser {
  id: string
  email: string
  name?: string
}

interface AuthState {
  user: AuthUser | null
  profile: Profile | null
  token: string | null
  isLoading: boolean
  isInitialized: boolean

  setUser: (user: AuthUser | null) => void
  setProfile: (profile: Profile | null) => void
  setToken: (token: string | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  signOut: () => void
  hasRole: (role: UserRole) => boolean
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      token: null,
      isLoading: true,
      isInitialized: false,

      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setToken: (token) => {
        set({ token })
        if (typeof window !== 'undefined') {
          if (token) localStorage.setItem('token', token)
          else localStorage.removeItem('token')
        }
      },
      setLoading: (isLoading) => set({ isLoading }),
      setInitialized: (isInitialized) => set({ isInitialized }),

      signOut: () => {
        if (typeof window !== 'undefined') localStorage.removeItem('token')
        set({ user: null, profile: null, token: null })
      },

      hasRole: (role) => {
        const { profile } = get()
        if (!profile) return false
        if (profile.role === 'admin') return true
        return profile.role === role
      },

      isAuthenticated: () => {
        const { user, token } = get()
        return !!user && !!token
      },
    }),
    {
      name: 'eventsphere-auth',
      // Only persist profile — token is in localStorage separately
      partialize: (state) => ({ profile: state.profile }),
    }
  )
)
