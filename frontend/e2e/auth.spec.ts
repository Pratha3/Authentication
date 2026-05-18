/**
 * AUTH-001…AUTH-010 — E2E Authentication flow.
 */
import { test, expect } from '@playwright/test'
import { TEST_USER, signUp, expectToast } from './helpers'

test.describe('Authentication', () => {
  test('AUTH-001 user can sign up with valid credentials', async ({ page }) => {
    await signUp(page)
    // Should land on onboarding or discover
    await expect(page).toHaveURL(/\/onboarding|\/discover/)
  })

  test('AUTH-002 shows error for duplicate email', async ({ page }) => {
    const uniqueUser = { ...TEST_USER, email: `dup_${Date.now()}@test.com` }
    await signUp(page, uniqueUser)
    await page.goto('/signup')
    await page.getByLabel('Full Name').fill(uniqueUser.name)
    await page.getByLabel('Email').fill(uniqueUser.email)
    await page.getByLabel('Password', { exact: true }).fill(uniqueUser.password)
    await page.getByLabel('Confirm Password').fill(uniqueUser.password)
    await page.getByRole('button', { name: /create account/i }).click()
    await expectToast(page, /already exists/i)
  })

  test('AUTH-003 signup validates minimum password length', async ({ page }) => {
    await page.goto('/signup')
    await page.getByLabel('Full Name').fill('Test User')
    await page.getByLabel('Email').fill('short@test.com')
    await page.getByLabel('Password', { exact: true }).fill('short')
    await page.getByLabel('Confirm Password').fill('short')
    await page.getByRole('button', { name: /create account/i }).click()
    await expect(page.getByText(/at least 8/i)).toBeVisible()
  })

  test('AUTH-004 signup validates email format', async ({ page }) => {
    await page.goto('/signup')
    await page.getByLabel('Full Name').fill('Test')
    await page.getByLabel('Email').fill('not-an-email')
    await page.getByLabel('Password', { exact: true }).fill('Password123!')
    await page.getByLabel('Confirm Password').fill('Password123!')
    await page.getByRole('button', { name: /create account/i }).click()
    await expect(page.getByText(/invalid email/i)).toBeVisible()
  })

  test('AUTH-006 user can log in and session persists on refresh', async ({ page }) => {
    const u = { ...TEST_USER, email: `persist_${Date.now()}@test.com` }
    await signUp(page, u)
    await page.goto('/login')
    await page.getByLabel('Email').fill(u.email)
    await page.getByLabel('Password').fill(u.password)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL(/\/discover/)

    // Refresh and verify still authenticated
    await page.reload()
    await expect(page.getByRole('button', { name: /avatar|user menu/i }).first()).toBeVisible({ timeout: 8000 })
  })

  test('AUTH-007 user can log out', async ({ page }) => {
    const u = { ...TEST_USER, email: `logout_${Date.now()}@test.com` }
    await signUp(page, u)
    // Open user menu and sign out
    await page.locator('button[aria-haspopup="menu"]').first().click()
    await page.getByRole('menuitem', { name: /sign out/i }).click()
    await expectToast(page, /signed out/i)
    await expect(page).toHaveURL('/')
  })

  test('AUTH-008 protected page redirects to login', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForURL(/\/login/)
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
  })

  test('landing page loads correctly', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /discover events/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /explore events/i })).toBeVisible()
  })
})
