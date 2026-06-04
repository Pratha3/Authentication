import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { APP_NAME, APP_DESCRIPTION } from '@/constants'
import { GlobalAIChat } from '@/components/shared/GlobalAIChat'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s | ${APP_NAME}` },
  description: APP_DESCRIPTION,
  keywords: ['events', 'meetup', 'marathon', 'community', 'local events', 'event discovery'],
  openGraph: {
    type: 'website',
    title: APP_NAME,
    description: APP_DESCRIPTION,
    siteName: APP_NAME,
  },
  twitter: { card: 'summary_large_image', title: APP_NAME, description: APP_DESCRIPTION },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${plusJakartaSans.variable} font-sans`}>
      <body className="font-sans antialiased min-h-screen bg-background text-foreground relative overflow-x-hidden">
        {/* Decorative background glows */}
        <div className="pointer-events-none fixed left-1/2 top-0 -z-10 h-[600px] w-full -translate-x-1/2 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,oklch(0.72_0.22_196_/_12%),transparent)]" />
        <div className="pointer-events-none fixed right-0 top-1/4 -z-10 h-[500px] w-[500px] bg-[radial-gradient(circle_at_center,oklch(0.65_0.22_300_/_8%),transparent)] blur-3xl" />
        <div className="pointer-events-none fixed -left-20 top-2/3 -z-10 h-[600px] w-[600px] bg-[radial-gradient(circle_at_center,oklch(0.72_0.22_196_/_6%),transparent)] blur-3xl" />

        <Providers>
          {children}
          <GlobalAIChat />
        </Providers>
      </body>
    </html>
  )
}
