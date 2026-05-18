/**
 * Unit tests for src/lib/utils.ts
 */
import {
  cn,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatCurrency,
  formatDistance,
  calculateDistance,
  getCapacityPercentage,
  slugify,
  truncate,
  getInitials,
} from '@/lib/utils'

describe('cn — class merger', () => {
  it('merges class names without conflicts', () => {
    expect(cn('text-sm', 'font-bold')).toBe('text-sm font-bold')
  })

  it('resolves Tailwind conflicts (later wins)', () => {
    expect(cn('text-sm', 'text-lg')).toBe('text-lg')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible')
  })
})

describe('formatDate', () => {
  it('formats ISO string to readable date', () => {
    const result = formatDate('2025-12-25T00:00:00.000Z')
    expect(result).toMatch(/Dec/)
    expect(result).toMatch(/25/)
    expect(result).toMatch(/2025/)
  })

  it('handles invalid date gracefully', () => {
    expect(() => formatDate('not-a-date')).not.toThrow()
  })
})

describe('formatCurrency', () => {
  it('formats INR correctly', () => {
    const result = formatCurrency(1000, 'INR')
    expect(result).toContain('1,000')
  })

  it('handles zero', () => {
    expect(formatCurrency(0)).toBeTruthy()
  })
})

describe('calculateDistance', () => {
  it('returns 0 for same coordinates', () => {
    expect(calculateDistance(19.076, 72.877, 19.076, 72.877)).toBe(0)
  })

  it('calculates Mumbai to Delhi approximately 1155km', () => {
    const dist = calculateDistance(19.076, 72.877, 28.7041, 77.1025)
    expect(dist).toBeGreaterThan(1100)
    expect(dist).toBeLessThan(1220)
  })

  it('distance is symmetric', () => {
    const d1 = calculateDistance(19.076, 72.877, 12.9716, 77.5946)
    const d2 = calculateDistance(12.9716, 77.5946, 19.076, 72.877)
    expect(Math.abs(d1 - d2)).toBeLessThan(0.001)
  })
})

describe('formatDistance', () => {
  it('shows meters for sub-km distances', () => {
    expect(formatDistance(0.5)).toContain('500')
    expect(formatDistance(0.5)).toContain('m')
  })

  it('shows km for larger distances', () => {
    expect(formatDistance(5.3)).toContain('5.3')
    expect(formatDistance(5.3)).toContain('km')
  })
})

describe('getCapacityPercentage', () => {
  it('returns 0 when capacity is null', () => {
    expect(getCapacityPercentage(null, 10)).toBe(0)
  })

  it('returns 0 when capacity is 0', () => {
    expect(getCapacityPercentage(0, 0)).toBe(0)
  })

  it('calculates correct percentage', () => {
    expect(getCapacityPercentage(100, 75)).toBe(75)
  })

  it('caps at 100 when overbooked', () => {
    expect(getCapacityPercentage(10, 15)).toBe(100)
  })
})

describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('Tech Meetup 2025')).toBe('tech-meetup-2025')
  })

  it('removes special characters', () => {
    expect(slugify('Hello, World!')).toBe('hello-world')
  })

  it('collapses multiple hyphens', () => {
    expect(slugify('test--double')).toBe('test-double')
  })
})

describe('truncate', () => {
  it('does not truncate short strings', () => {
    expect(truncate('short', 100)).toBe('short')
  })

  it('truncates and adds ellipsis', () => {
    const result = truncate('This is a long string', 10)
    expect(result.length).toBeLessThanOrEqual(11)
    expect(result).toContain('…')
  })
})

describe('getInitials', () => {
  it('returns initials from full name', () => {
    expect(getInitials('John Doe')).toBe('JD')
  })

  it('returns single initial for one word', () => {
    expect(getInitials('John')).toBe('J')
  })

  it('limits to 2 characters', () => {
    expect(getInitials('John Michael Doe').length).toBeLessThanOrEqual(2)
  })
})
