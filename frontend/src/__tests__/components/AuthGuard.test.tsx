/**
 * AUTH-008 — AuthGuard redirects unauthenticated users.
 */
import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import { render } from '../setup/renderWithProviders'
import { AuthGuard } from '@/components/shared/AuthGuard'
import { useAuthStore } from '@/store/auth.store'

const mockPush = jest.fn()
const mockReplace = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => '/profile',
  useSearchParams: () => ({ get: jest.fn() }),
}))

function setAuth(user: unknown, role?: string) {
  useAuthStore.setState({
    user: user as any,
    profile: user
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? { id: '1', email: 'a@t.com', full_name: null, avatar_url: null, role: (role ?? 'user') as any, bio: null, phone: null, location: null, latitude: null, longitude: null, interests: [], is_active: true, created_at: '', updated_at: '' }
      : null,
    token: user ? 'tok' : null,
    isLoading: false,
    isInitialized: true,
  })
}

beforeEach(() => {
  mockPush.mockClear()
  mockReplace.mockClear()
})

describe('AuthGuard', () => {
  it('AUTH-008 redirects to /login when not authenticated', async () => {
    setAuth(null)
    render(
      <AuthGuard>
        <div>Protected</div>
      </AuthGuard>
    )
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(expect.stringContaining('/login'))
    })
    expect(screen.queryByText('Protected')).not.toBeInTheDocument()
  })

  it('renders children when authenticated', async () => {
    setAuth({ id: '1', email: 'a@t.com' })
    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    )
    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })

  it('AUTH-010 redirects organizer away from admin-only page', async () => {
    setAuth({ id: '1', email: 'a@t.com' }, 'organizer')
    render(
      <AuthGuard requiredRole="admin">
        <div>Admin Only</div>
      </AuthGuard>
    )
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/discover')
    })
  })

  it('shows spinner while auth is initializing', () => {
    useAuthStore.setState({ user: null, isLoading: true, isInitialized: false, token: null, profile: null })
    render(
      <AuthGuard>
        <div>Content</div>
      </AuthGuard>
    )
    expect(screen.queryByText('Content')).not.toBeInTheDocument()
  })
})
