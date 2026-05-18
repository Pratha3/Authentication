import { type Page, expect } from '@playwright/test'

export const TEST_USER = {
  email: `e2e_${Date.now()}@eventsphere.test`,
  password: 'TestPass123!',
  name: 'E2E Test User',
}

export const TEST_ORGANIZER = {
  email: `org_${Date.now()}@eventsphere.test`,
  password: 'TestPass123!',
  name: 'E2E Organizer',
}

/** Signs up a new user via UI and verifies successful redirect */
export async function signUp(page: Page, user = TEST_USER) {
  await page.goto('/signup')
  await page.getByLabel('Full Name').fill(user.name)
  await page.getByLabel('Email').fill(user.email)
  await page.getByLabel('Password', { exact: true }).fill(user.password)
  await page.getByLabel('Confirm Password').fill(user.password)
  await page.getByRole('button', { name: /create account/i }).click()
  // Wait for redirect away from signup
  await page.waitForURL(/\/onboarding|\/discover/)
}

/** Logs in via API call (faster than UI login for setup) */
export async function loginViaAPI(page: Page, user = TEST_USER) {
  const apiBase = process.env.E2E_API_URL ?? 'http://localhost:5000/api'
  const res = await page.request.post(`${apiBase}/auth/login`, {
    data: { email: user.email, password: user.password },
  })
  if (!res.ok()) throw new Error(`Login failed: ${res.status()}`)
  const { token } = await res.json()
  // Inject token into localStorage
  await page.goto('/')
  await page.evaluate((t: string) => localStorage.setItem('token', t), token)
}

/** Waits for the toast with given text */
export async function expectToast(page: Page, text: string | RegExp) {
  await expect(page.locator('[data-sonner-toaster]')).toContainText(text)
}
