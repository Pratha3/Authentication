import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'jest-environment-jsdom',
  testMatch: ['<rootDir>/src/__tests__/**/*.test.{ts,tsx}'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup/jest.setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/app/**',
    '!src/services/supabase/**',
    '!src/types/**',
    '!src/constants/**',
  ],
  coverageThreshold: {
    global: { branches: 55, functions: 65, lines: 65, statements: 65 },
  },
  verbose: true,
}

export default createJestConfig(config)
