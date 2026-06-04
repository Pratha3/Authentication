const { spawn } = require('node:child_process')
const { chromium } = require('@playwright/test')

const port = Number(process.env.E2E_PORT || 3000)
const baseUrl = process.env.E2E_BASE_URL || `http://127.0.0.1:${port}`
const apiUrl = process.env.E2E_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api'

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForHttp(url, timeoutMs = 60_000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      // Server is still starting.
    }
    await wait(1_000)
  }
  throw new Error(`Timed out waiting for ${url}`)
}

async function main() {
  await waitForHttp(`${apiUrl.replace(/\/$/, '')}/health`, 30_000)

  const app = spawn(
    process.execPath,
    [require.resolve('next/dist/bin/next'), 'start', '-p', String(port)],
    { cwd: __dirname + '/..', env: process.env, stdio: 'inherit' }
  )

  try {
    await waitForHttp(baseUrl)

    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

    await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60_000 })
    await page.getByText('Discover Local Events', { exact: false }).waitFor({ timeout: 10_000 })
    await page.getByRole('link', { name: 'Explore Events' }).click()
    await page.waitForURL('**/discover', { timeout: 10_000 })
    await page.getByText('Discover Events', { exact: false }).waitFor({ timeout: 10_000 })

    await browser.close()
  } finally {
    app.kill()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
