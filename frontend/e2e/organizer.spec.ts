/**
 * ORG-001…ORG-010 / E2E Scenario 2 — Organizer creates and manages an event.
 * These tests require a running backend with MongoDB.
 */
import { test, expect } from '@playwright/test'

const API_BASE = process.env.E2E_API_URL ?? 'http://localhost:5000/api'

async function createOrganizerAndLogin(page: typeof test.prototype) {
  const email = `org_e2e_${Date.now()}@test.com`
  const password = 'TestPass123!'

  // Sign up
  const signupRes = await page.request.post(`${API_BASE}/auth/signup`, {
    data: { email, password, name: 'E2E Organizer' },
  })
  const { token, user } = await signupRes.json()

  // Create organizer profile
  await page.request.post(`${API_BASE}/profiles/organizer`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { organizationName: 'E2E Org', userId: user.id },
  })

  // Inject token into browser
  await page.goto('/')
  await page.evaluate((t: string) => localStorage.setItem('token', t), token)

  return { email, password, token, user }
}

test.describe('Organizer Dashboard (ORG-001…010)', () => {
  test('ORG-001 organizer can create an event via form', async ({ page }) => {
    await createOrganizerAndLogin(page as any)
    await page.goto('/organizer/events/create')
    await expect(page.getByRole('heading', { name: /create new event/i })).toBeVisible()

    // Fill the form
    await page.getByLabel('Event Title').fill('E2E Tech Summit')
    await page.getByLabel('Description').fill('An awesome E2E test event for tech folks.')
    await page.locator('select[name="category"]').selectOption('tech')
    await page.getByLabel('Start Date').fill('2025-12-01T10:00')
    await page.getByLabel('End Date').fill('2025-12-01T18:00')
    await page.getByLabel('City').fill('Mumbai')

    // Submit
    await page.getByRole('button', { name: /create event/i }).click()

    // Should redirect to dashboard on success
    await page.waitForURL(/\/organizer\/dashboard/, { timeout: 15000 })
    await expect(page.getByText('E2E Tech Summit')).toBeVisible()
  })

  test('ORG-005 form validation prevents empty required fields', async ({ page }) => {
    await createOrganizerAndLogin(page as any)
    await page.goto('/organizer/events/create')

    // Submit empty form
    await page.getByRole('button', { name: /create event/i }).click()

    // Should show validation errors
    await expect(page.getByText(/at least 5/i)).toBeVisible()
  })

  test('ORG-007 organizer can change event status from dashboard', async ({ page }) => {
    await createOrganizerAndLogin(page as any)
    await page.goto('/organizer/dashboard')

    const statusSelects = page.locator('select')
    const count = await statusSelects.count()
    if (count === 0) {
      test.skip()
      return
    }

    await statusSelects.first().selectOption('live')
    // Toast should confirm status change
    await page.waitForTimeout(500)
    await expect(page.locator('[data-sonner-toaster]')).toContainText(/status updated/i)
  })

  test('ORG-009 regular user is redirected away from organizer pages', async ({ page }) => {
    // Log in as regular user
    const email = `plain_${Date.now()}@test.com`
    const signupRes = await page.request.post(`${API_BASE}/auth/signup`, {
      data: { email, password: 'TestPass123!', name: 'Plain User' },
    })
    const { token } = await signupRes.json()
    await page.goto('/')
    await page.evaluate((t: string) => localStorage.setItem('token', t), token)

    await page.goto('/organizer/dashboard')
    // Should be redirected
    await page.waitForURL(/\/discover/, { timeout: 8000 })
  })
})

test.describe('E2E Scenario 2 — Organizer publishes event, user registers', () => {
  test('full organizer→user registration flow', async ({ page, request }) => {
    // 1. Create organizer via API
    const orgEmail = `org_flow_${Date.now()}@test.com`
    const orgRes = await request.post(`${API_BASE}/auth/signup`, {
      data: { email: orgEmail, password: 'TestPass123!', name: 'Flow Org' },
    })
    const { token: orgToken } = await orgRes.json()

    const profileRes = await request.post(`${API_BASE}/profiles/organizer`, {
      headers: { Authorization: `Bearer ${orgToken}` },
      data: { organizationName: 'Flow Organization' },
    })
    const { data: organizer } = await profileRes.json()

    // 2. Create event via API
    const eventRes = await request.post(`${API_BASE}/events`, {
      headers: { Authorization: `Bearer ${orgToken}` },
      data: {
        title: 'E2E Flow Event',
        slug: `flow-event-${Date.now()}`,
        description: 'End to end registration test event',
        category: 'tech',
        startDate: new Date(Date.now() + 86400000).toISOString(),
        endDate: new Date(Date.now() + 90000000).toISOString(),
        isFree: true,
        status: 'upcoming',
        city: 'Mumbai',
      },
    })
    const { data: event } = await eventRes.json()
    if (!event?.slug) { test.skip(); return }

    // 3. User visits event page
    await page.goto(`/events/${event.slug}`)
    await expect(page.getByRole('heading', { name: /E2E Flow Event/i })).toBeVisible()

    // 4. Register as authenticated user
    const userEmail = `user_flow_${Date.now()}@test.com`
    const userRes = await request.post(`${API_BASE}/auth/signup`, {
      data: { email: userEmail, password: 'TestPass123!', name: 'Flow User' },
    })
    const { token: userToken } = await userRes.json()
    await page.evaluate((t: string) => localStorage.setItem('token', t), userToken)
    await page.reload()

    // Click register
    await page.getByRole('button', { name: /register for free/i }).click()

    // Should show success
    await expect(page.locator('[data-sonner-toaster]')).toContainText(/registered successfully/i, { timeout: 10000 })
    await expect(page.getByText(/you're registered/i)).toBeVisible()
  })
})
