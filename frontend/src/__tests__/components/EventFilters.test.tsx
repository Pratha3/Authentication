/**
 * USER-003…USER-005 — EventFilters interaction tests.
 */
import React from 'react'
import { screen, fireEvent } from '@testing-library/react'
import { render } from '../setup/renderWithProviders'
import { EventFilters } from '@/components/events/EventFilters'
import { useEventsStore } from '@/store/events.store'

// Reset store state before each test
beforeEach(() => {
  useEventsStore.setState({
    events: [],
    filters: { sortBy: 'date', page: 1, pageSize: 12 },
    mapView: false,
    page: 1,
    hasMore: true,
    isLoadingEvents: false,
    totalCount: 0,
    featuredEvents: [],
    selectedEvent: null,
    userLocation: null,
  })
})

describe('EventFilters', () => {
  it('renders sort dropdown', () => {
    render(<EventFilters />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('renders Filters button with 0 active filters', () => {
    render(<EventFilters />)
    expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument()
  })

  it('toggles filter panel open/close', () => {
    render(<EventFilters />)
    const btn = screen.getByRole('button', { name: /filters/i })

    // Panel hidden initially
    expect(screen.queryByText('Category')).not.toBeInTheDocument()

    // Open
    fireEvent.click(btn)
    expect(screen.getByText('Category')).toBeInTheDocument()

    // Close
    fireEvent.click(btn)
    expect(screen.queryByText('Category')).not.toBeInTheDocument()
  })

  it('USER-003 selecting category updates store filters', () => {
    render(<EventFilters />)

    // Open filters
    fireEvent.click(screen.getByRole('button', { name: /filters/i }))

    // Click "Tech" category button
    const techBtn = screen.getByRole('button', { name: /Tech/i })
    fireEvent.click(techBtn)

    const filters = useEventsStore.getState().filters
    expect(filters.category).toContain('tech')
  })

  it('can select multiple categories', () => {
    render(<EventFilters />)
    fireEvent.click(screen.getByRole('button', { name: /filters/i }))

    fireEvent.click(screen.getByRole('button', { name: /Tech/i }))
    fireEvent.click(screen.getByRole('button', { name: /Music/i }))

    const filters = useEventsStore.getState().filters
    expect(filters.category).toContain('tech')
    expect(filters.category).toContain('music')
  })

  it('deselects category on second click', () => {
    render(<EventFilters />)
    fireEvent.click(screen.getByRole('button', { name: /filters/i }))

    const techBtn = screen.getByRole('button', { name: /Tech/i })
    fireEvent.click(techBtn)
    fireEvent.click(techBtn)

    const filters = useEventsStore.getState().filters
    expect(filters.category ?? []).not.toContain('tech')
  })

  it('USER-005 sort selector updates sortBy filter', () => {
    render(<EventFilters />)
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'popularity' } })
    expect(useEventsStore.getState().filters.sortBy).toBe('popularity')
  })

  it('shows Clear button when filters are active', () => {
    useEventsStore.setState({ filters: { sortBy: 'date', page: 1, pageSize: 12, isFree: true } })
    render(<EventFilters />)
    expect(screen.getByText(/clear/i)).toBeInTheDocument()
  })

  it('Clear button resets all filters', () => {
    useEventsStore.setState({ filters: { sortBy: 'date', page: 1, pageSize: 12, isFree: true, category: ['tech'] } })
    render(<EventFilters />)
    fireEvent.click(screen.getByText(/clear/i))
    const filters = useEventsStore.getState().filters
    expect(filters.isFree).toBeUndefined()
    expect(filters.category).toBeUndefined()
  })

  it('Map/Grid toggle changes mapView in store', () => {
    render(<EventFilters />)
    fireEvent.click(screen.getByRole('button', { name: /map/i }))
    expect(useEventsStore.getState().mapView).toBe(true)
  })
})
