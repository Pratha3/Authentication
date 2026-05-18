/**
 * USER-008 / USER-009 — useBookmark hook unit tests.
 */
import { renderHook, act } from '@testing-library/react'
import { useBookmark } from '@/hooks/useBookmark'
import { useBookmarksStore } from '@/store/bookmarks.store'
import { useAuthStore } from '@/store/auth.store'

jest.mock('@/services/api/bookmarks.service', () => ({
  addBookmark: jest.fn().mockResolvedValue({
    data: { id: 'bm1', user_id: 'u1', event_id: 'evt1', created_at: '' },
    error: null,
  }),
  removeBookmark: jest.fn().mockResolvedValue({ data: null, error: null }),
}))

beforeEach(() => {
  useAuthStore.setState({
    user: { id: 'user1', email: 'u@t.com' },
    token: 'tok',
    profile: null, isLoading: false, isInitialized: true,
  })
  useBookmarksStore.setState({ bookmarks: [], bookmarkedIds: new Set(), isLoading: false })
})

afterEach(() => { jest.clearAllMocks() })

describe('useBookmark', () => {
  it('returns bookmarked=false initially', () => {
    const { result } = renderHook(() => useBookmark('evt1'))
    expect(result.current.bookmarked).toBe(false)
  })

  it('USER-008 toggleBookmark adds bookmark when not bookmarked', async () => {
    const { result } = renderHook(() => useBookmark('evt1'))
    await act(async () => { await result.current.toggleBookmark() })
    expect(useBookmarksStore.getState().isBookmarked('evt1')).toBe(true)
  })

  it('USER-009 toggleBookmark removes bookmark when already bookmarked', async () => {
    useBookmarksStore.setState({
      bookmarks: [{ id: 'bm1', user_id: 'u1', event_id: 'evt1', created_at: '' }],
      bookmarkedIds: new Set(['evt1']),
      isLoading: false,
    })
    const { result } = renderHook(() => useBookmark('evt1'))
    expect(result.current.bookmarked).toBe(true)

    await act(async () => { await result.current.toggleBookmark() })
    expect(useBookmarksStore.getState().isBookmarked('evt1')).toBe(false)
  })

  it('shows error toast when user is not logged in', async () => {
    useAuthStore.setState({ user: null, token: null, profile: null, isLoading: false, isInitialized: true })
    const { toast } = require('sonner')
    const { result } = renderHook(() => useBookmark('evt1'))

    await act(async () => { await result.current.toggleBookmark() })
    expect(toast.error).toHaveBeenCalledWith('Sign in to save events')
  })

  it('shows success toast on bookmark add', async () => {
    const { toast } = require('sonner')
    const { result } = renderHook(() => useBookmark('evt2'))
    await act(async () => { await result.current.toggleBookmark() })
    expect(toast.success).toHaveBeenCalledWith('Event saved to bookmarks')
  })

  it('shows success toast on bookmark remove', async () => {
    useBookmarksStore.setState({
      bookmarks: [{ id: 'bm2', user_id: 'u1', event_id: 'evt2', created_at: '' }],
      bookmarkedIds: new Set(['evt2']),
      isLoading: false,
    })
    const { toast } = require('sonner')
    const { result } = renderHook(() => useBookmark('evt2'))
    await act(async () => { await result.current.toggleBookmark() })
    expect(toast.success).toHaveBeenCalledWith('Removed from bookmarks')
  })
})
