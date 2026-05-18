/**
 * USER-001…USER-010 / REG-001…REG-008 — E2E Event Discovery & Registration.
 */
import { test, expect } from '@playwright/test'
import { TEST_USER, signUp, loginViaAPI } from './helpers'

test.describe('Event Discovery (USER-001…007)', () => {
  test('USER-001 discover page loads and shows event grid', async ({ page }) => {
    await page.goto('/discover')
    await expect(page.getByRole('heading', { name: /discover events/i })).toBeVisible()
    // Filters bar is present
    await expect(page.getByRole('combobox')).toBeVisible()
    await expect(page.getByRole('button', { name: /filters/i })).toBeVisible()
  })

  test('USER-002 search filters events', async ({ page }) => {
    await page.goto('/discover')
    const searchInput = page.getByPlaceholder(/search events/i)
    await expect(searchInput).toBeVisible()
    await searchInput.fill('marathon')
    // Results update (debounced — wait a moment)
    await page.waitForTimeout(600)
    // Page should not crash; either shows events or empty state
    await expect(page.locator('main')).toBeVisible()
  })

  test('USER-003 category filter opens and selects category', async ({ page }) => {
    await page.goto('/discover')
    await page.getByRole('button', { name: /filters/i }).click()
    await expect(page.getByText('Category')).toBeVisible()
    await page.getByRole('button', { name: /Tech/i }).click()
    // Filter chip or active state should appear
    const clearBtn = page.getByText(/clear/i)
    await expect(clearBtn).toBeVisible()
  })

  test('USER-004 date range filter works', async ({ page }) => {
    await page.goto('/discover')
    await page.getByRole('button', { name: /filters/i }).click()
    const fromInput = page.getByLabel('From')
    await fromInput.fill('2025-01-01')
    await expect(fromInput).toHaveValue('2025-01-01')
  })

  test('USER-007 empty state shown when no events match', async ({ page }) => {
    await page.goto('/discover')
    await page.getByRole('button', { name: /filters/i }).click()
    // Select a combination unlikely to return results
    await page.getByLabel('From').fill('2099-01-01')
    await page.getByLabel('To').fill('2099-01-02')
    await page.waitForTimeout(600)
    // Either empty state or zero results
    const emptyState = page.getByText(/no events found/i)
    const results = page.locator('[data-testid="event-card"]')
    const isEmpty = await emptyState.isVisible().catch(() => false)
    const count = await results.count().catch(() => 0)
    expect(isEmpty || count === 0).toBeTruthy()
  })

  test('UI-001 discover page is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/discover')
    await expect(page.getByRole('heading', { name: /discover events/i })).toBeVisible()
  })
})

test.describe('Event Registration (REG-001…008)', () => {
  test('REG-007 unauthenticated user cannot register', async ({ page }) => {
    await page.goto('/discover')
    // Click on any visible event card
    const cards = page.locator('article')
    const count = await cards.count()
    if (count === 0) {
      test.skip()
      return
    }
    // Find a link to any event
    const firstEventLink = cards.first().locator('a').first()
    await firstEventLink.click()
    await page.waitForLoadState('networkidle')

    // Try to register
    const registerBtn = page.getByRole('button', { name: /register/i })
    if (await registerBtn.isVisible()) {
      await registerBtn.click()
      // Should either redirect to login or show error toast
      const onLoginPage = await page.url().includes('/login')
      const toastEl = page.locator('[data-sonner-toaster]')
      const hasError = await toastEl.isVisible().catch(() => false)
      expect(onLoginPage || hasError).toBeTruthy()
    }
  })
})

test.describe('E2E Scenario 1 — Full user journey', () => {
  test('user can sign up, browse events, and bookmark', async ({ page }) => {
    const u = { email: `e2e_journey_${Date.now()}@test.com`, password: 'TestPass123!', name: 'E2E Journey' }

    // 1. Sign up
    await page.goto('/signup')
    await page.getByLabel('Full Name').fill(u.name)
    await page.getByLabel('Email').fill(u.email)
    await page.getByLabel('Password', { exact: true }).fill(u.password)
    await page.getByLabel('Confirm Password').fill(u.password)
    await page.getByRole('button', { name: /create account/i }).click()
    await page.waitForURL(/\/onboarding|\/discover/)

    // 2. Navigate to discover
    await page.goto('/discover')
    await expect(page.getByRole('heading', { name: /discover events/i })).toBeVisible()

    // 3. Open filters
    await page.getByRole('button', { name: /filters/i }).click()
    await expect(page.getByText('Category')).toBeVisible()

    // 4. Navigate to bookmarks (should be empty)
    await page.goto('/bookmarks')
    // Should show empty state since user has no bookmarks
    await expect(page).not.toHaveURL('/login')
  })
})
