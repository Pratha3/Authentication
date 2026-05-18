/**
 * Zustand store unit tests — auth, events, bookmarks, notifications, UI.
 */
import { act } from '@testing-library/react'
import { useAuthStore } from '@/store/auth.store'
import { useEventsStore } from '@/store/events.store'
import { useBookmarksStore } from '@/store/bookmarks.store'
import { useNotificationsStore } from '@/store/notifications.store'
import { useUIStore } from '@/store/ui.store'
import type { Event, Bookmark, Notification } from '@/types'

// Helper: get store snapshot outside React
const getAuth = () => useAuthStore.getState()
const getEvents = () => useEventsStore.getState()
const getBookmarks = () => useBookmarksStore.getState()
const getNotifs = () => useNotificationsStore.getState()
const getUI = () => useUIStore.getState()

beforeEach(() => {
  // Reset stores to initial state
  useAuthStore.setState({ user: null, profile: null, token: null, isLoading: false, isInitialized: false })
  useEventsStore.setState({ events: [], filters: { sortBy: 'date', page: 1, pageSize: 12 }, page: 1, hasMore: true })
  useBookmarksStore.setState({ bookmarks: [], bookmarkedIds: new Set() })
  useNotificationsStore.setState({ notifications: [], unreadCount: 0 })
  useUIStore.setState({ sidebarOpen: false, commandPaletteOpen: false })
})

// ─── Auth store ───────────────────────────────────────────────────────────────
describe('useAuthStore', () => {
  it('setUser stores user and setToken stores token', () => {
    act(() => {
      getAuth().setUser({ id: '1', email: 'a@t.com' })
      getAuth().setToken('tok123')
    })
    expect(getAuth().user?.email).toBe('a@t.com')
    expect(getAuth().token).toBe('tok123')
    expect(getAuth().isAuthenticated()).toBe(true)
  })

  it('signOut clears user, profile and token', () => {
    act(() => {
      getAuth().setUser({ id: '1', email: 'a@t.com' })
      getAuth().setToken('tok')
      getAuth().signOut()
    })
    expect(getAuth().user).toBeNull()
    expect(getAuth().token).toBeNull()
    expect(getAuth().isAuthenticated()).toBe(false)
  })

  it('hasRole returns true for exact role', () => {
    act(() => {
      getAuth().setProfile({
        id: '1', email: 'a@t.com', full_name: null, avatar_url: null,
        role: 'organizer', bio: null, phone: null, location: null,
        latitude: null, longitude: null, interests: [], is_active: true,
        created_at: '', updated_at: '',
      })
    })
    expect(getAuth().hasRole('organizer')).toBe(true)
    expect(getAuth().hasRole('admin')).toBe(false)
  })

  it('admin hasRole returns true for any role', () => {
    act(() => {
      getAuth().setProfile({
        id: '1', email: 'a@t.com', full_name: null, avatar_url: null,
        role: 'admin', bio: null, phone: null, location: null,
        latitude: null, longitude: null, interests: [], is_active: true,
        created_at: '', updated_at: '',
      })
    })
    expect(getAuth().hasRole('user')).toBe(true)
    expect(getAuth().hasRole('organizer')).toBe(true)
  })
})

// ─── Events store ─────────────────────────────────────────────────────────────
describe('useEventsStore', () => {
  const mockEvent = (id: string): Event => ({
    id, title: `Event ${id}`, slug: id, description: 'Desc',
    organizer_id: 'org1', venue_id: null, category: 'tech',
    tags: [], status: 'upcoming', start_date: '', end_date: '', timezone: 'Asia/Kolkata',
    is_online: false, online_url: null, address: null, city: null, state: null,
    country: null, latitude: null, longitude: null, capacity: null,
    current_attendees: 0, price: 0, currency: 'INR', is_free: true,
    registration_deadline: null, min_age: null, max_age: null, requirements: null,
    is_featured: false, view_count: 0, created_at: '', updated_at: '',
    short_description: null, banner_url: null,
  })

  it('setEvents replaces events list', () => {
    act(() => { getEvents().setEvents([mockEvent('1'), mockEvent('2')]) })
    expect(getEvents().events).toHaveLength(2)
  })

  it('appendEvents adds to existing list', () => {
    act(() => {
      getEvents().setEvents([mockEvent('1')])
      getEvents().appendEvents([mockEvent('2'), mockEvent('3')])
    })
    expect(getEvents().events).toHaveLength(3)
  })

  it('setFilters resets events and page', () => {
    act(() => {
      getEvents().setEvents([mockEvent('1')])
      getEvents().setPage(3)
      getEvents().setFilters({ category: ['tech'] })
    })
    expect(getEvents().events).toHaveLength(0)
    expect(getEvents().page).toBe(1)
    expect(getEvents().filters.category).toEqual(['tech'])
  })

  it('resetFilters clears all filters', () => {
    act(() => {
      getEvents().setFilters({ category: ['tech'], isFree: true })
      getEvents().resetFilters()
    })
    expect(getEvents().filters.category).toBeUndefined()
    expect(getEvents().filters.isFree).toBeUndefined()
  })

  it('updateEventAttendees updates count in list and selectedEvent', () => {
    act(() => {
      getEvents().setEvents([mockEvent('evt1')])
      getEvents().setSelectedEvent(mockEvent('evt1'))
      getEvents().updateEventAttendees('evt1', 42)
    })
    expect(getEvents().events[0].current_attendees).toBe(42)
    expect(getEvents().selectedEvent?.current_attendees).toBe(42)
  })

  it('updateEventStatus updates status everywhere', () => {
    act(() => {
      getEvents().setEvents([mockEvent('evt1')])
      getEvents().updateEventStatus('evt1', 'live')
    })
    expect(getEvents().events[0].status).toBe('live')
  })
})

// ─── Bookmarks store ──────────────────────────────────────────────────────────
describe('useBookmarksStore', () => {
  const makeBookmark = (eventId: string): Bookmark => ({
    id: `bm_${eventId}`, user_id: 'u1', event_id: eventId, created_at: '',
  })

  it('setBookmarks populates bookmarkedIds Set', () => {
    act(() => { getBookmarks().setBookmarks([makeBookmark('e1'), makeBookmark('e2')]) })
    expect(getBookmarks().isBookmarked('e1')).toBe(true)
    expect(getBookmarks().isBookmarked('e3')).toBe(false)
  })

  it('addBookmark adds to store', () => {
    act(() => { getBookmarks().addBookmark(makeBookmark('e5')) })
    expect(getBookmarks().isBookmarked('e5')).toBe(true)
    expect(getBookmarks().bookmarks).toHaveLength(1)
  })

  it('removeBookmark removes from store', () => {
    act(() => {
      getBookmarks().addBookmark(makeBookmark('e6'))
      getBookmarks().removeBookmark('e6')
    })
    expect(getBookmarks().isBookmarked('e6')).toBe(false)
    expect(getBookmarks().bookmarks).toHaveLength(0)
  })
})

// ─── Notifications store ──────────────────────────────────────────────────────
describe('useNotificationsStore', () => {
  const makeNotif = (id: string, is_read = false): Notification => ({
    id, user_id: 'u1', title: 'Test', body: 'Body',
    type: 'system', data: null, is_read, created_at: '',
  })

  it('setNotifications computes unread count', () => {
    act(() => { getNotifs().setNotifications([makeNotif('1'), makeNotif('2'), makeNotif('3', true)]) })
    expect(getNotifs().unreadCount).toBe(2)
  })

  it('addNotification increments unreadCount for unread', () => {
    act(() => { getNotifs().addNotification(makeNotif('new')) })
    expect(getNotifs().unreadCount).toBe(1)
  })

  it('markAsRead decrements unreadCount', () => {
    act(() => {
      getNotifs().setNotifications([makeNotif('x')])
      getNotifs().markAsRead('x')
    })
    expect(getNotifs().unreadCount).toBe(0)
    expect(getNotifs().notifications[0].is_read).toBe(true)
  })

  it('markAllAsRead sets all to read', () => {
    act(() => {
      getNotifs().setNotifications([makeNotif('a'), makeNotif('b')])
      getNotifs().markAllAsRead()
    })
    expect(getNotifs().unreadCount).toBe(0)
    expect(getNotifs().notifications.every(n => n.is_read)).toBe(true)
  })
})

// ─── UI store ─────────────────────────────────────────────────────────────────
describe('useUIStore', () => {
  it('toggleSidebar flips open state', () => {
    act(() => { getUI().toggleSidebar() })
    expect(getUI().sidebarOpen).toBe(true)
    act(() => { getUI().toggleSidebar() })
    expect(getUI().sidebarOpen).toBe(false)
  })

  it('openRegistrationModal sets eventId', () => {
    act(() => { getUI().openRegistrationModal('evt123') })
    expect(getUI().registrationModalEventId).toBe('evt123')
    act(() => { getUI().closeRegistrationModal() })
    expect(getUI().registrationModalEventId).toBeNull()
  })
})
