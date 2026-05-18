/**
 * AUTH-001…AUTH-004 — LoginForm validation + submission.
 */
import React from 'react'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../setup/renderWithProviders'
import { LoginForm } from '@/features/auth/LoginForm'

// Mock the API
jest.mock('@/lib/api', () => ({
  authApi: {
    login: jest.fn(),
  },
  setToken: jest.fn(),
  getToken: jest.fn().mockReturnValue(null),
  clearToken: jest.fn(),
}))

jest.mock('@/services/api/profiles.service', () => ({
  fetchProfile: jest.fn().mockResolvedValue({ data: null }),
}))

describe('LoginForm', () => {
  const { authApi } = require('@/lib/api')

  beforeEach(() => {
    authApi.login.mockReset()
  })

  it('renders email, password fields and submit button', () => {
    render(<LoginForm />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('AUTH-004 shows error for invalid email format', async () => {
    render(<LoginForm />)
    await userEvent.type(screen.getByLabelText('Email'), 'not-an-email')
    await userEvent.type(screen.getByLabelText('Password'), 'password')
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
    })
  })

  it('AUTH-003 shows error for short password', async () => {
    render(<LoginForm />)
    await userEvent.type(screen.getByLabelText('Email'), 'user@test.com')
    await userEvent.type(screen.getByLabelText('Password'), '123')
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(screen.getByText(/at least 6/i)).toBeInTheDocument()
    })
  })

  it('AUTH-001 calls authApi.login with correct credentials', async () => {
    authApi.login.mockResolvedValue({
      token: 'tok', user: { id: '1', email: 'user@test.com', name: 'User' }, message: 'ok',
    })
    render(<LoginForm />)
    await userEvent.type(screen.getByLabelText('Email'), 'user@test.com')
    await userEvent.type(screen.getByLabelText('Password'), 'Password123')
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith('user@test.com', 'Password123')
    })
  })

  it('shows API error message on login failure', async () => {
    authApi.login.mockRejectedValue(new Error('Invalid email or password.'))
    const { toast } = require('sonner')
    render(<LoginForm />)
    await userEvent.type(screen.getByLabelText('Email'), 'user@test.com')
    await userEvent.type(screen.getByLabelText('Password'), 'WrongPass1')
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid email or password.')
    })
  })

  it('disables submit button while loading', async () => {
    authApi.login.mockImplementation(() => new Promise(() => {})) // never resolves
    render(<LoginForm />)
    await userEvent.type(screen.getByLabelText('Email'), 'user@test.com')
    await userEvent.type(screen.getByLabelText('Password'), 'Password123')
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()
    })
  })

  it('UI-002 toggles password visibility', async () => {
    render(<LoginForm />)
    const passwordInput = screen.getByLabelText('Password')
    expect(passwordInput).toHaveAttribute('type', 'password')

    // Click the eye toggle button
    const toggleBtn = screen.getByRole('button', { name: '' }) // eye button has no name
    fireEvent.click(toggleBtn)
    expect(passwordInput).toHaveAttribute('type', 'text')
  })

  it('has link to signup page', () => {
    render(<LoginForm />)
    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/signup')
  })
})
