import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { ProfileClient } from '@/features/profile/ProfileClient'

export const metadata: Metadata = { title: 'My Profile' }

export default function ProfilePage() {
  return (
    <>
      <Navbar />
      <ProfileClient />
    </>
  )
}
