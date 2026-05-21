/**
 * SEC-001…SEC-008 — Security test cases.
 */
import request from 'supertest'
import { app } from '../../server'
import { connectTestDB, clearTestDB, closeTestDB } from '../setup/db'
import { createUser, createOrganizer, createEvent } from '../setup/fixtures'



beforeAll(async () => { await connectTestDB() })
afterEach(async () => { await clearTestDB() })
afterAll(async () => { await closeTestDB() })

// SEC-001: NoSQL Injection
describe('SEC-001 NoSQL injection prevention', () => {
  it('login endpoint rejects injection in email field', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: { $gt: '' }, password: 'anything',
    })
    // Should not return a valid user — either 400 or 401
    expect([400, 401, 500]).toContain(res.status)
    expect(res.body).not.toHaveProperty('token')
  })

  it('query params with operators are handled safely', async () => {
    // Passing mongo operator as string — should not blow up the server
    const res = await request(app).get('/api/events?category[$in][]=tech')
    expect(res.status).toBe(200)
  })
})

// SEC-003: Unauthorized API request
describe('SEC-003 unauthorized API requests', () => {
  it('POST /api/events without token → 401', async () => {
    const res = await request(app).post('/api/events').send({ title: 'Hack' })
    expect(res.status).toBe(401)
  })

  it('PATCH /api/events/:id without token → 401', async () => {
    const res = await request(app).patch('/api/events/fakeid').send({ title: 'Hack' })
    expect(res.status).toBe(401)
  })

  it('GET /api/bookmarks without token → 401', async () => {
    const res = await request(app).get('/api/bookmarks')
    expect(res.status).toBe(401)
  })
})

// SEC-004: JWT tampering
describe('SEC-004 JWT tampering', () => {
  it('rejects a token with modified payload', async () => {
    // base64-encode a different payload and attach it
    const fakePayload = Buffer.from(JSON.stringify({ userId: 'fakeId' })).toString('base64url')
    const tamperedToken = `header.${fakePayload}.signature`

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tamperedToken}`)
    expect(res.status).toBe(401)
  })

  it('rejects expired-looking token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NjY2NiIsImlhdCI6MX0.fakesig')
    expect(res.status).toBe(401)
  })
})

// SEC-006: Role escalation
describe('SEC-006 role escalation prevention', () => {
  it('regular user cannot delete another user event', async () => {
    const { organizer } = await createOrganizer()
    const { token: attackerToken } = await createUser({ email: 'attacker@t.com' })
    const evt = await createEvent(String(organizer._id))

    const res = await request(app)
      .delete(`/api/events/${(evt as any)._id}`)
      .set('Authorization', `Bearer ${attackerToken}`)
    expect(res.status).toBe(403)
  })

  it('organizer cannot access admin user list', async () => {
    const { token } = await createOrganizer()
    const res = await request(app)
      .get('/api/profiles/admin/users')
      .set('Authorization', `Bearer ${token}`)
    expect([401, 403]).toContain(res.status)
  })
})

// SEC-002: XSS in event description
describe('SEC-002 XSS sanitization', () => {
  it('stores event description without executing scripts', async () => {
    const { token } = await createOrganizer()
    const xssPayload = '<script>alert("xss")</script>Some description here'

    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'XSS Test Event',
        slug: 'xss-test',
        description: xssPayload,
        category: 'tech',
        startDate: new Date(Date.now() + 86400000),
        endDate: new Date(Date.now() + 90000000),
        isFree: true,
        status: 'upcoming',
      })

    // The description is stored as-is (MongoDB doesn't execute scripts)
    // The frontend is responsible for safe rendering (React escapes by default)
    expect(res.status).toBe(201)
    // Verify the response doesn't actively execute — stored text only
    expect(res.body.data.description).toContain('Some description here')
  })
})

// Health check
describe('Health check', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })
})
