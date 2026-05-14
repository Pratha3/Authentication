'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: 'user' | 'organizer' | 'admin'
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { user, profile, isLoading, isInitialized } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isInitialized) return
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname ?? '/discover')}`)
      return
    }
    if (requiredRole && profile?.role !== requiredRole && profile?.role !== 'admin') {
      router.replace('/discover')
    }
  }, [user, profile, isInitialized, requiredRole, router, pathname])

  if (!isInitialized || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) return null

  return <>{children}</>
}
