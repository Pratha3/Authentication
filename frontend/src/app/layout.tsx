import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { APP_NAME, APP_DESCRIPTION } from '@/constants'
import { GlobalAIChat } from '@/components/shared/GlobalAIChat'

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
    <html lang="en" suppressHydrationWarning className="font-sans">
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">
        <Providers>
          {children}
          <GlobalAIChat />
        </Providers>
      </body>
    </html>
  )
}
