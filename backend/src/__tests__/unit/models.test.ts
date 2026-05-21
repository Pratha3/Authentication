/**
 * DB-USER-001…DB-USER-005 / DB-EVENT-001…DB-EVENT-005 / DB-REG-001…DB-REG-004
 * MongoDB schema / model unit tests.
 */
import mongoose from 'mongoose'
import { connectTestDB, clearTestDB, closeTestDB } from '../setup/db'
import { User } from '../../models/User'
import { Profile } from '../../models/Profile'
import { Event } from '../../models/Event'
import { Registration } from '../../models/Registration'
import { Organizer } from '../../models/Organizer'
import { Bookmark } from '../../models/Bookmark'
import { Notification } from '../../models/Notification'

beforeAll(async () => { await connectTestDB() })
afterEach(async () => { await clearTestDB() })
afterAll(async () => { await closeTestDB() })

// ─── User model ───────────────────────────────────────────────────────────────
describe('User model (DB-USER-001…005)', () => {
  it('DB-USER-001 creates user document with required fields', async () => {
    const user = await User.create({
      email: 'test@test.com', password: 'hashed', name: 'Test',
    })
    expect(user._id).toBeDefined()
    expect(user.email).toBe('test@test.com')
  })

  it('DB-USER-002 rejects duplicate email (unique index)', async () => {
    await User.create({ email: 'dup@test.com', password: 'hashedpassword' })
    await expect(
      User.create({ email: 'dup@test.com', password: 'hashedpassword' })
    ).rejects.toThrow()
  })

  it('DB-USER-003 rejects missing required email field', async () => {
    await expect(User.create({ password: 'hashedpassword' })).rejects.toThrow()
  })

  it('DB-USER-003 rejects missing required password field', async () => {
    await expect(User.create({ email: 'nopw@test.com' })).rejects.toThrow()
  })

  it('stores email as lowercase', async () => {
    const user = await User.create({ email: 'UPPER@TEST.COM', password: 'hashedpassword' })
    expect(user.email).toBe('upper@test.com')
  })
})

// ─── Profile model ────────────────────────────────────────────────────────────
describe('Profile model (DB-USER-004…005)', () => {
  it('creates profile with default role=user', async () => {
    const user = await User.create({ email: 'p@test.com', password: 'hashedpassword' })
    const profile = await Profile.create({ userId: user._id, email: 'p@test.com' })
    expect(profile.role).toBe('user')
    expect(profile.isActive).toBe(true)
  })

  it('DB-USER-004 updates role for soft-flag changes', async () => {
    const user = await User.create({ email: 'r@test.com', password: 'hashedpassword' })
    const profile = await Profile.create({ userId: user._id, email: 'r@test.com' })
    await Profile.findByIdAndUpdate(profile._id, { role: 'organizer' })
    const updated = await Profile.findById(profile._id)
    expect(updated?.role).toBe('organizer')
  })

  it('DB-USER-005 queries by role correctly', async () => {
    const u1 = await User.create({ email: 'a@t.com', password: 'hashed' })
    const u2 = await User.create({ email: 'b@t.com', password: 'hashed' })
    await Profile.create({ userId: u1._id, email: 'a@t.com', role: 'organizer' })
    await Profile.create({ userId: u2._id, email: 'b@t.com', role: 'user' })

    const organizers = await Profile.find({ role: 'organizer' })
    expect(organizers).toHaveLength(1)
    expect(organizers[0].email).toBe('a@t.com')
  })
})

// ─── Event model ──────────────────────────────────────────────────────────────
describe('Event model (DB-EVENT-001…005)', () => {
  let organizerId: mongoose.Types.ObjectId

  beforeEach(async () => {
    const user = await User.create({ email: 'org@test.com', password: 'hashedpassword' })
    const org = await Organizer.create({ userId: user._id, organizationName: 'Org' })
    organizerId = org._id as mongoose.Types.ObjectId
  })

  it('DB-EVENT-001 creates event with all required fields', async () => {
    const evt = await Event.create({
      organizerId,
      title: 'Test Event',
      slug: 'test-event',
      description: 'Desc',
      category: 'tech',
      status: 'upcoming',
      startDate: new Date(),
      endDate: new Date(Date.now() + 3600000),
    })
    expect(evt._id).toBeDefined()
    expect(evt.currentAttendees).toBe(0)
    expect(evt.viewCount).toBe(0)
  })

  it('DB-EVENT-002 rejects missing organizerId', async () => {
    await expect(
      Event.create({ title: 'No org', slug: 'no-org', description: 'D', category: 'tech', startDate: new Date(), endDate: new Date() })
    ).rejects.toThrow()
  })

  it('DB-EVENT-003 stores image path correctly', async () => {
    const evt = await Event.create({
      organizerId, title: 'Img', slug: 'img-event', description: 'D', category: 'tech',
      startDate: new Date(), endDate: new Date(Date.now() + 3600000),
      bannerUrl: '/uploads/event-images/banner.jpg',
    })
    expect(evt.bannerUrl).toBe('/uploads/event-images/banner.jpg')
  })

  it('DB-EVENT-004 rejects negative capacity', async () => {
    await expect(
      Event.create({
        organizerId, title: 'Cap', slug: 'cap-event', description: 'D', category: 'tech',
        startDate: new Date(), endDate: new Date(Date.now() + 3600000), capacity: -5,
      })
    ).rejects.toThrow()
  })

  it('DB-EVENT-005 increments attendee count atomically', async () => {
    const evt = await Event.create({
      organizerId, title: 'Count', slug: 'count-event', description: 'D',
      category: 'tech', startDate: new Date(), endDate: new Date(Date.now() + 3600000),
    })
    await Event.findByIdAndUpdate(evt._id, { $inc: { currentAttendees: 1 } })
    await Event.findByIdAndUpdate(evt._id, { $inc: { currentAttendees: 1 } })
    const updated = await Event.findById(evt._id)
    expect(updated?.currentAttendees).toBe(2)
  })
})

// ─── Registration model ───────────────────────────────────────────────────────
describe('Registration model (DB-REG-001…004)', () => {
  it('DB-REG-001 creates registration with unique ticket code', async () => {
    const u = await User.create({ email: 'regu@t.com', password: 'hashed' })
    const org = await Organizer.create({ userId: u._id, organizationName: 'O' })
    const evt = await Event.create({
      organizerId: org._id, title: 'R', slug: 'r-evt', description: 'D',
      category: 'tech', startDate: new Date(), endDate: new Date(Date.now() + 3600000),
    })
    const reg = await Registration.create({ eventId: evt._id, userId: u._id })
    expect(reg.ticketCode).toBeDefined()
    expect(reg.ticketCode.length).toBeGreaterThan(4)
    expect(reg.status).toBe('confirmed')
  })

  it('DB-REG-002 rejects duplicate eventId+userId', async () => {
    const u = await User.create({ email: 'dupreg@t.com', password: 'hashed' })
    const org = await Organizer.create({ userId: u._id, organizationName: 'O' })
    const evt = await Event.create({
      organizerId: org._id, title: 'DupR', slug: 'dup-r', description: 'D',
      category: 'tech', startDate: new Date(), endDate: new Date(Date.now() + 3600000),
    })
    await Registration.create({ eventId: evt._id, userId: u._id })
    await expect(
      Registration.create({ eventId: evt._id, userId: u._id })
    ).rejects.toThrow()
  })

  it('DB-REG-003 can delete registration', async () => {
    const u = await User.create({ email: 'delreg@t.com', password: 'hashed' })
    const org = await Organizer.create({ userId: u._id, organizationName: 'O' })
    const evt = await Event.create({
      organizerId: org._id, title: 'Del', slug: 'del-r', description: 'D',
      category: 'tech', startDate: new Date(), endDate: new Date(Date.now() + 3600000),
    })
    const reg = await Registration.create({ eventId: evt._id, userId: u._id })
    await Registration.deleteOne({ _id: reg._id })
    const found = await Registration.findById(reg._id)
    expect(found).toBeNull()
  })
})

// ─── Notification model ───────────────────────────────────────────────────────
describe('Notification model', () => {
  it('creates notification with isRead=false by default', async () => {
    const u = await User.create({ email: 'notif@t.com', password: 'hashed' })
    const notif = await Notification.create({
      userId: u._id, title: 'Hello', body: 'World', type: 'system',
    })
    expect(notif.isRead).toBe(false)
  })

  it('can mark notification as read', async () => {
    const u = await User.create({ email: 'read@t.com', password: 'hashed' })
    const notif = await Notification.create({
      userId: u._id, title: 'Read me', body: 'Body', type: 'system',
    })
    await Notification.findByIdAndUpdate(notif._id, { isRead: true })
    const updated = await Notification.findById(notif._id)
    expect(updated?.isRead).toBe(true)
  })
})
