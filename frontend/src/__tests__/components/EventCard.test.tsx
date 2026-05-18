/**
 * UI-001…UI-008 / USER-008…009 — EventCard rendering & bookmark interaction.
 */
import React from 'react'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { render } from '../setup/renderWithProviders'
import { EventCard } from '@/components/events/EventCard'
import type { Event } from '@/types'

// Mock bookmark hook
jest.mock('@/hooks/useBookmark', () => ({
  useBookmark: (id: string) => ({
    bookmarked: id === 'bookmarked-event',
    toggleBookmark: jest.fn(),
  }),
}))

const baseEvent: Event = {
  id: 'evt1',
  title: 'Tech Meetup Mumbai',
  slug: 'tech-meetup-mumbai',
  description: 'A great event',
  short_description: 'Short desc',
  organizer_id: 'org1',
  venue_id: null,
  category: 'tech',
  tags: ['react', 'nodejs'],
  status: 'upcoming',
  start_date: new Date(Date.now() + 86400000).toISOString(),
  end_date: new Date(Date.now() + 90000000).toISOString(),
  timezone: 'Asia/Kolkata',
  is_online: false,
  online_url: null,
  address: '123 Main St',
  city: 'Mumbai',
  state: null,
  country: 'India',
  latitude: 19.076,
  longitude: 72.877,
  capacity: 100,
  current_attendees: 45,
  price: 0,
  currency: 'INR',
  is_free: true,
  registration_deadline: null,
  min_age: null,
  max_age: null,
  requirements: null,
  is_featured: false,
  view_count: 200,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  banner_url: null,
}

describe('EventCard', () => {
  it('renders event title and category', () => {
    render(<EventCard event={baseEvent} />)
    expect(screen.getByText('Tech Meetup Mumbai')).toBeInTheDocument()
    expect(screen.getByText(/Tech/)).toBeInTheDocument()
  })

  it('shows Free badge for free events', () => {
    render(<EventCard event={baseEvent} />)
    expect(screen.getByText('Free')).toBeInTheDocument()
  })

  it('shows price for paid events', () => {
    render(<EventCard event={{ ...baseEvent, is_free: false, price: 499 }} />)
    expect(screen.getByText(/499/)).toBeInTheDocument()
  })

  it('shows attendee count', () => {
    render(<EventCard event={baseEvent} />)
    expect(screen.getByText(/45 attending/)).toBeInTheDocument()
  })

  it('shows city/venue info', () => {
    render(<EventCard event={baseEvent} />)
    expect(screen.getByText('Mumbai')).toBeInTheDocument()
  })

  it('shows status badge', () => {
    render(<EventCard event={baseEvent} />)
    expect(screen.getByText('Upcoming')).toBeInTheDocument()
  })

  it('shows Live status with correct badge', () => {
    render(<EventCard event={{ ...baseEvent, status: 'live' }} />)
    expect(screen.getByText('Live Now')).toBeInTheDocument()
  })

  it('renders capacity progress bar', () => {
    const { container } = render(<EventCard event={baseEvent} />)
    const bar = container.querySelector('[style*="width"]')
    expect(bar).toBeInTheDocument()
  })

  it('shows Full badge when event is at capacity', () => {
    render(<EventCard event={{ ...baseEvent, current_attendees: 100 }} />)
    expect(screen.getByText('Full')).toBeInTheDocument()
  })

  it('shows distance when provided', () => {
    render(<EventCard event={{ ...baseEvent, distance: 3.2 }} />)
    expect(screen.getByText(/3.2.*km/)).toBeInTheDocument()
  })

  it('bookmark button shows filled state when already bookmarked', () => {
    render(<EventCard event={{ ...baseEvent, id: 'bookmarked-event', is_bookmarked: true }} />)
    // The BookmarkCheck icon should be rendered (not Bookmark)
    const btn = screen.getByLabelText('Remove bookmark')
    expect(btn).toBeInTheDocument()
  })

  it('calls toggleBookmark on bookmark button click', async () => {
    const { useBookmark } = require('@/hooks/useBookmark')
    const toggle = jest.fn()
    useBookmark.mockReturnValue({ bookmarked: false, toggleBookmark: toggle })

    render(<EventCard event={baseEvent} />)
    fireEvent.click(screen.getByLabelText('Bookmark event'))
    await waitFor(() => expect(toggle).toHaveBeenCalledTimes(1))
  })

  it('links to event detail page', () => {
    render(<EventCard event={baseEvent} />)
    const link = screen.getByRole('link', { name: /Tech Meetup Mumbai/ })
    expect(link).toHaveAttribute('href', '/events/tech-meetup-mumbai')
  })
})

describe('EventCard skeleton', () => {
  it('renders skeleton placeholder', () => {
    const { EventCardSkeleton } = require('@/components/events/EventCardSkeleton')
    const { container } = render(<EventCardSkeleton />)
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })
})
