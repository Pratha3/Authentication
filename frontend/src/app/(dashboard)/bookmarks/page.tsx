import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { BookmarksClient } from '@/features/bookmarks/BookmarksClient'

export const metadata: Metadata = { title: 'Saved Events' }

export default function BookmarksPage() {
  return (
    <>
      <Navbar />
      <BookmarksClient />
    </>
  )
}
