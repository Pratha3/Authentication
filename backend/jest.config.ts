import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/src/__tests__/**/*.test.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  globalSetup: '<rootDir>/src/__tests__/setup/globalSetup.ts',
  globalTeardown: '<rootDir>/src/__tests__/setup/globalTeardown.ts',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/__tests__/**',
    '!src/server.ts',
  ],
  coverageThresholds: {
    global: { branches: 55, functions: 65, lines: 65, statements: 65 },
  },
  testTimeout: 30000,
  verbose: true,
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: { strict: false } }],
  },
}

export default config
