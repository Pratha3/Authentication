import React from 'react'
import { render, type RenderOptions } from '@testing-library/react'

// Minimal provider wrapper — add ThemeProvider, etc. here if needed
function AllProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function renderWithProviders(ui: React.ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: AllProviders, ...options })
}

export * from '@testing-library/react'
export { renderWithProviders as render }
