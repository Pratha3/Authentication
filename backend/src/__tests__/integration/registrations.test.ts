/**
 * REG-001…REG-008 / DB-REG-001…DB-REG-005
 * Integration tests for /api/registrations endpoints.
 */
import request from 'supertest'
import { app } from '../../server'
import { connectTestDB, clearTestDB, closeTestDB } from '../setup/db'
import { createUser, createOrganizer, createEvent } from '../setup/fixtures'
import { Event } from '../../models/Event'
import { Registration } from '../../models/Registration'



beforeAll(async () => { await connectTestDB() })
afterEach(async () => { await clearTestDB() })
afterAll(async () => { await closeTestDB() })

// ─── REG-001: Register for event ─────────────────────────────────────────────
describe('POST /api/registrations', () => {
  it('REG-001 registers user for event and increments attendee count', async () => {
    const { organizer } = await createOrganizer()
    const evt = await createEvent(String(organizer._id))
    const { token } = await createUser()

    const res = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${token}`)
      .send({ eventId: String(evt._id) })

    expect(res.status).toBe(201)
    expect(res.body.data.status).toBe('confirmed')

    // REG-005: Attendee count incremented
    const updated = await Event.findById(evt._id)
    expect(updated?.currentAttendees).toBe(1)
  })

  // REG-002: Duplicate registration
  it('REG-002 prevents duplicate registration', async () => {
    const { organizer } = await createOrganizer()
    const evt = await createEvent(String(organizer._id))
    const { token } = await createUser()

    await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${token}`)
      .send({ eventId: String(evt._id) })

    const res = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${token}`)
      .send({ eventId: String(evt._id) })

    expect(res.status).toBe(409)
  })

  // REG-003: Full event → waitlist
  it('REG-003 waitlists when event is at capacity', async () => {
    const { organizer } = await createOrganizer()
    const evt = await createEvent(String(organizer._id), { capacity: 1 })

    const { token: t1 } = await createUser({ email: 'a@t.com' })
    const { token: t2 } = await createUser({ email: 'b@t.com' })

    await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${t1}`)
      .send({ eventId: String(evt._id) })

    const res = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${t2}`)
      .send({ eventId: String(evt._id) })

    expect(res.status).toBe(201)
    expect(res.body.data.status).toBe('waitlisted')
  })

  // REG-007: Unauthorized
  it('REG-007 returns 401 without auth token', async () => {
    const { organizer } = await createOrganizer()
    const evt = await createEvent(String(organizer._id))

    const res = await request(app)
      .post('/api/registrations')
      .send({ eventId: String(evt._id) })
    expect(res.status).toBe(401)
  })

  it('returns 400 when event is cancelled', async () => {
    const { organizer } = await createOrganizer()
    const evt = await createEvent(String(organizer._id), { status: 'cancelled' })
    const { token } = await createUser()

    const res = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${token}`)
      .send({ eventId: String(evt._id) })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/cancelled/i)
  })
})

// ─── REG-004: Cancel registration ────────────────────────────────────────────
describe('PATCH /api/registrations/:eventId/cancel', () => {
  it('REG-004 cancels registration and decrements attendee count', async () => {
    const { organizer } = await createOrganizer()
    const evt = await createEvent(String(organizer._id))
    const { token, user } = await createUser()

    await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${token}`)
      .send({ eventId: String(evt._id) })

    const res = await request(app)
      .patch(`/api/registrations/${evt._id}/cancel`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)

    const updated = await Event.findById(evt._id)
    expect(updated?.currentAttendees).toBe(0)
  })

  it('returns 404 when no registration exists', async () => {
    const { organizer } = await createOrganizer()
    const evt = await createEvent(String(organizer._id))
    const { token } = await createUser()

    const res = await request(app)
      .patch(`/api/registrations/${evt._id}/cancel`)
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })
})

// ─── GET /api/registrations/my ────────────────────────────────────────────────
describe('GET /api/registrations/my', () => {
  it('returns only confirmed registrations for current user', async () => {
    const { organizer } = await createOrganizer()
    const evt1 = await createEvent(String(organizer._id), { slug: 's1' })
    const evt2 = await createEvent(String(organizer._id), { slug: 's2' })
    const { token } = await createUser()

    await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${token}`)
      .send({ eventId: String(evt1._id) })
    await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${token}`)
      .send({ eventId: String(evt2._id) })

    const res = await request(app)
      .get('/api/registrations/my')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(2)
  })
})

// ─── DB-REG-005: High concurrency ─────────────────────────────────────────────
describe('DB-REG-005 concurrent registrations', () => {
  it('handles simultaneous registrations without data corruption', async () => {
    const { organizer } = await createOrganizer()
    const evt = await createEvent(String(organizer._id))

    const users = await Promise.all([
      createUser({ email: 'c1@t.com' }),
      createUser({ email: 'c2@t.com' }),
      createUser({ email: 'c3@t.com' }),
    ])

    await Promise.all(
      users.map(({ token }) =>
        request(app)
          .post('/api/registrations')
          .set('Authorization', `Bearer ${token}`)
          .send({ eventId: String(evt._id) })
      )
    )

    const updated = await Event.findById(evt._id)
    const regs = await Registration.countDocuments({ eventId: evt._id, status: 'confirmed' })
    expect(updated?.currentAttendees).toBe(regs)
  })
})
