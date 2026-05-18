/**
 * MAP-001 / MAP-002 — useLocation geolocation hook tests.
 */
import { renderHook, act, waitFor } from '@testing-library/react'
import { useLocation } from '@/hooks/useLocation'
import { useEventsStore } from '@/store/events.store'

beforeEach(() => {
  useEventsStore.setState({
    events: [], filters: { sortBy: 'date', page: 1, pageSize: 12 },
    userLocation: null, mapView: false, page: 1, hasMore: true,
    isLoadingEvents: false, totalCount: 0, featuredEvents: [], selectedEvent: null,
  })
})

describe('useLocation', () => {
  it('MAP-001 detects location when permission granted', async () => {
    const mockPosition = { coords: { latitude: 19.076, longitude: 72.877, accuracy: 10 } }
    Object.defineProperty(global.navigator, 'geolocation', {
      writable: true,
      value: {
        getCurrentPosition: (success: (p: unknown) => void) => success(mockPosition),
      },
    })

    const { result } = renderHook(() => useLocation())
    await act(async () => { result.current.detectLocation() })

    await waitFor(() => {
      expect(result.current.userLocation).toEqual({
        latitude: 19.076, longitude: 72.877, accuracy: 10,
      })
    })
    expect(result.current.error).toBeNull()
    expect(useEventsStore.getState().filters.latitude).toBe(19.076)
  })

  it('MAP-002 sets error when geolocation is denied', async () => {
    Object.defineProperty(global.navigator, 'geolocation', {
      writable: true,
      value: {
        getCurrentPosition: (_: unknown, error: (e: { message: string }) => void) =>
          error({ message: 'User denied geolocation' }),
      },
    })

    const { result } = renderHook(() => useLocation())
    await act(async () => { result.current.detectLocation() })

    await waitFor(() => { expect(result.current.error).toContain('User denied geolocation') })
    expect(result.current.userLocation).toBeNull()
  })

  it('MAP-002 handles missing geolocation API', async () => {
    Object.defineProperty(global.navigator, 'geolocation', { writable: true, value: undefined })

    const { result } = renderHook(() => useLocation())
    act(() => { result.current.detectLocation() })

    expect(result.current.error).toContain('not supported')
  })
})
