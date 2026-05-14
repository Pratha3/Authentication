import type { Metadata } from 'next'
import Link from 'next/link'
import { Zap } from 'lucide-react'
import { SignupForm } from '@/features/auth/SignupForm'

export const metadata: Metadata = { title: 'Create Account' }

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Link href="/" className="mb-8 flex items-center gap-2 font-bold text-xl">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-4 w-4 text-primary-foreground" />
        </div>
        EventSphere
      </Link>
      <SignupForm />
    </div>
  )
}
