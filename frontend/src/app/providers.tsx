'use client'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications'

function AppInitializer() {
  useAuth()
  useRealtimeNotifications()
  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <AppInitializer />
      {children}
      <Toaster position="bottom-right" richColors expand closeButton />
    </ThemeProvider>
  )
}
