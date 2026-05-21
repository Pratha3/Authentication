/**
 * ORG-001…ORG-009 / API-001…API-007 / USER-001…USER-007
 * Integration tests for /api/events endpoints.
 */
import request from 'supertest'
import { app } from '../../server'
import { connectTestDB, clearTestDB, closeTestDB } from '../setup/db'
import { createUser, createOrganizer, createEvent } from '../setup/fixtures'



beforeAll(async () => { await connectTestDB() })
afterEach(async () => { await clearTestDB() })
afterAll(async () => { await closeTestDB() })

// ─── API-001: GET /api/events ─────────────────────────────────────────────────
describe('GET /api/events', () => {
  it('API-001 returns paginated events', async () => {
    const { organizer } = await createOrganizer()
    await createEvent(String(organizer._id), { status: 'upcoming' })
    await createEvent(String(organizer._id), { status: 'upcoming', slug: 'slug-2' })

    const res = await request(app).get('/api/events')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body).toHaveProperty('count', 2)
    expect(res.body).toHaveProperty('hasMore', false)
  })

  // USER-002: Search
  it('USER-002 filters by search query', async () => {
    const { organizer } = await createOrganizer()
    await createEvent(String(organizer._id), { title: 'React Meetup', slug: 'react-meetup' })
    await createEvent(String(organizer._id), { title: 'Vue Conference', slug: 'vue-conf' })

    const res = await request(app).get('/api/events?search=React')
    expect(res.status).toBe(200)
    // Text search may return the React event
    const titles = res.body.data.map((e: any) => e.title)
    expect(titles.some((t: string) => t.includes('React'))).toBe(true)
  })

  // USER-003: Filter by category
  it('USER-003 filters by category', async () => {
    const { organizer } = await createOrganizer()
    await createEvent(String(organizer._id), { category: 'tech', slug: 'tech-1' })
    await createEvent(String(organizer._id), { category: 'music', slug: 'music-1' })

    const res = await request(app).get('/api/events?category=tech')
    expect(res.status).toBe(200)
    expect(res.body.data.every((e: any) => e.category === 'tech')).toBe(true)
  })

  // USER-007: Empty state
  it('USER-007 returns empty array when no events', async () => {
    const res = await request(app).get('/api/events')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(0)
  })

  // API-006: Invalid filter
  it('API-006 handles invalid status filter gracefully', async () => {
    const res = await request(app).get('/api/events?status=nonexistent')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(0)
  })
})

// ─── GET /api/events/featured ─────────────────────────────────────────────────
describe('GET /api/events/featured', () => {
  it('returns only featured events', async () => {
    const { organizer } = await createOrganizer()
    await createEvent(String(organizer._id), { isFeatured: true, slug: 'feat-1' })
    await createEvent(String(organizer._id), { isFeatured: false, slug: 'not-feat' })

    const res = await request(app).get('/api/events/featured')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].isFeatured).toBe(true)
  })
})

// ─── API-002: GET /api/events/:slug ──────────────────────────────────────────
describe('GET /api/events/:slug', () => {
  it('API-002 returns single event by slug', async () => {
    const { organizer } = await createOrganizer()
    const evt = await createEvent(String(organizer._id), { slug: 'my-event' })

    const res = await request(app).get('/api/events/my-event')
    expect(res.status).toBe(200)
    expect(res.body.data.slug).toBe('my-event')
    expect(res.body.data.title).toBe(evt.title)
  })

  it('API-006 returns 404 for unknown slug', async () => {
    const res = await request(app).get('/api/events/does-not-exist')
    expect(res.status).toBe(404)
  })
})

// ─── API-003: POST /api/events ────────────────────────────────────────────────
describe('POST /api/events', () => {
  it('ORG-001 organizer can create event', async () => {
    const { token } = await createOrganizer()
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'New Event',
        slug: 'new-event',
        description: 'A fantastic new event',
        category: 'tech',
        startDate: new Date(Date.now() + 86400000),
        endDate: new Date(Date.now() + 90000000),
        isFree: true,
        status: 'upcoming',
      })
    expect(res.status).toBe(201)
    expect(res.body.data.title).toBe('New Event')
  })

  it('API-007 unauthenticated POST returns 401', async () => {
    const res = await request(app).post('/api/events').send({ title: 'Test' })
    expect(res.status).toBe(401)
  })

  it('ORG-005 event with duplicate slug returns 409', async () => {
    const { organizer, token } = await createOrganizer()
    await createEvent(String(organizer._id), { slug: 'dup-slug' })

    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Duplicate Slug Event',
        slug: 'dup-slug',
        description: 'Some description',
        category: 'tech',
        startDate: new Date(Date.now() + 86400000),
        endDate: new Date(Date.now() + 90000000),
        isFree: true,
        status: 'upcoming',
      })
    expect(res.status).toBe(409)
  })
})

// ─── API-004: PATCH /api/events/:id ──────────────────────────────────────────
describe('PATCH /api/events/:id', () => {
  it('ORG-003 organizer can edit own event', async () => {
    const { organizer, token } = await createOrganizer()
    const evt = await createEvent(String(organizer._id))

    const res = await request(app)
      .patch(`/api/events/${(evt as any)._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Title' })
    expect(res.status).toBe(200)
    expect(res.body.data.title).toBe('Updated Title')
  })

  it('ORG-009 different user cannot edit event', async () => {
    const { organizer } = await createOrganizer()
    const { token: otherToken } = await createUser()
    const evt = await createEvent(String(organizer._id))

    const res = await request(app)
      .patch(`/api/events/${(evt as any)._id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ title: 'Hacked Title' })
    expect(res.status).toBe(403)
  })

  // ORG-007: Status change
  it('ORG-007 organizer can update event status', async () => {
    const { organizer, token } = await createOrganizer()
    const evt = await createEvent(String(organizer._id))

    const res = await request(app)
      .patch(`/api/events/${(evt as any)._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'live' })
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('live')
  })
})

// ─── API-005: DELETE /api/events/:id ─────────────────────────────────────────
describe('DELETE /api/events/:id', () => {
  it('ORG-004 organizer can delete own event', async () => {
    const { organizer, token } = await createOrganizer()
    const evt = await createEvent(String(organizer._id))

    const res = await request(app)
      .delete(`/api/events/${(evt as any)._id}`)
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)

    const check = await request(app).get(`/api/events/${evt.slug}`)
    expect(check.status).toBe(404)
  })

  it('non-owner cannot delete event', async () => {
    const { organizer } = await createOrganizer()
    const { token: otherToken } = await createUser()
    const evt = await createEvent(String(organizer._id))

    const res = await request(app)
      .delete(`/api/events/${(evt as any)._id}`)
      .set('Authorization', `Bearer ${otherToken}`)
    expect(res.status).toBe(403)
  })
})

// ─── Pagination ───────────────────────────────────────────────────────────────
describe('Event pagination (USER-006)', () => {
  it('USER-006 paginates correctly', async () => {
    const { organizer } = await createOrganizer()
    for (let i = 0; i < 15; i++) {
      await createEvent(String(organizer._id), { slug: `evt-${i}` })
    }

    const page1 = await request(app).get('/api/events?page=1&pageSize=10')
    expect(page1.body.data).toHaveLength(10)
    expect(page1.body.hasMore).toBe(true)

    const page2 = await request(app).get('/api/events?page=2&pageSize=10')
    expect(page2.body.data).toHaveLength(5)
    expect(page2.body.hasMore).toBe(false)
  })
})
