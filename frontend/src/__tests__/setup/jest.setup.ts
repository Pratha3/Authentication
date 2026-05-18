import '@testing-library/jest-dom'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn(), prefetch: jest.fn() }),
  useSearchParams: () => ({ get: jest.fn().mockReturnValue(null) }),
  usePathname: () => '/',
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    const { createElement } = require('react')
    return createElement('img', props)
  },
}))

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: jest.fn() }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
  Toaster: () => null,
}))

// Silence console.error in tests (keeps output clean)
const originalError = console.error
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning:')) return
    originalError(...args)
  }
})
afterAll(() => { console.error = originalError })

// Clean Zustand stores between tests
afterEach(() => {
  jest.clearAllMocks()
})
