import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { User } from '../../models/User'
import { Profile } from '../../models/Profile'
import { Organizer } from '../../models/Organizer'
import { Event } from '../../models/Event'

export const makeToken = (userId: string) =>
  jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '1h' })

export async function createUser(overrides: Partial<{
  email: string; password: string; name: string; role: 'user' | 'organizer' | 'admin'
}> = {}) {
  const plain = overrides.password ?? 'Password123!'
  const hash = await bcrypt.hash(plain, 10)
  const user = await User.create({
    email: overrides.email ?? `user_${Date.now()}@test.com`,
    password: hash,
    name: overrides.name ?? 'Test User',
  })
  const profile = await Profile.create({
    userId: user._id,
    email: user.email,
    fullName: user.name,
    role: overrides.role ?? 'user',
  })
  return { user, profile, token: makeToken(String(user._id)), plainPassword: plain }
}

export async function createOrganizer() {
  const { user, profile, token } = await createUser({ role: 'organizer', name: 'Org User' })
  const organizer = await Organizer.create({
    userId: user._id,
    organizationName: 'Test Org',
    verificationStatus: 'approved',
  })
  await Profile.findOneAndUpdate({ userId: user._id }, { role: 'organizer' })
  return { user, profile, organizer, token }
}

export async function createAdmin() {
  const { user, profile, token } = await createUser({ role: 'admin', name: 'Admin User' })
  await Profile.findOneAndUpdate({ userId: user._id }, { role: 'admin' })
  return { user, profile, token }
}

export async function createEvent(organizerId: string, overrides: any = {}) {
  return Event.create({
    organizerId,
    title: overrides.title ?? 'Tech Meetup 2025',
    slug: overrides.slug ?? `tech-meetup-${Date.now()}`,
    description: 'A great event for all tech lovers.',
    category: 'tech',
    status: overrides.status ?? 'upcoming',
    startDate: new Date(Date.now() + 86400000),
    endDate: new Date(Date.now() + 90000000),
    isFree: true,
    isFeatured: overrides.isFeatured ?? false,
    city: 'Mumbai',
    latitude: 19.076,
    longitude: 72.877,
    ...overrides,
  })
}
