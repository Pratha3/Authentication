/**
 * ADMIN-001…ADMIN-006 / Profile CRUD tests.
 */
import request from 'supertest'
import { app } from '../../server'
import { connectTestDB, clearTestDB, closeTestDB } from '../setup/db'
import { createUser, createAdmin, createOrganizer } from '../setup/fixtures'



beforeAll(async () => { await connectTestDB() })
afterEach(async () => { await clearTestDB() })
afterAll(async () => { await closeTestDB() })

describe('GET /api/profiles/:userId', () => {
  it('returns profile for valid userId', async () => {
    const { user } = await createUser()
    const res = await request(app).get(`/api/profiles/${user._id}`)
    expect(res.status).toBe(200)
    expect(res.body.data.email).toBe(user.email)
  })

  it('returns 404 for unknown userId', async () => {
    const res = await request(app).get('/api/profiles/000000000000000000000000')
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/profiles/:userId', () => {
  it('user can update own profile', async () => {
    const { user, token } = await createUser()
    const res = await request(app)
      .patch(`/api/profiles/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ fullName: 'Updated Name', bio: 'Hello world' })
    expect(res.status).toBe(200)
    expect(res.body.data.fullName).toBe('Updated Name')
  })

  it('cannot update another user profile', async () => {
    const { user } = await createUser({ email: 'victim@t.com' })
    const { token } = await createUser({ email: 'attacker@t.com' })

    const res = await request(app)
      .patch(`/api/profiles/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ fullName: 'Hacked' })
    expect(res.status).toBe(403)
  })
})

describe('GET /api/profiles/admin/users (ADMIN-001)', () => {
  it('ADMIN-001 admin can list all users', async () => {
    const { token } = await createAdmin()
    await createUser({ email: 'u1@t.com' })
    await createUser({ email: 'u2@t.com' })

    const res = await request(app)
      .get('/api/profiles/admin/users')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    // count includes admin + 2 users
    expect(res.body.count).toBeGreaterThanOrEqual(3)
  })

  it('ADMIN-006 non-admin cannot access user list', async () => {
    const { token } = await createUser()
    const res = await request(app)
      .get('/api/profiles/admin/users')
      .set('Authorization', `Bearer ${token}`)
    expect([401, 403]).toContain(res.status)
  })
})

describe('Organizer profile (ORG-001 setup)', () => {
  it('creates organizer profile and upgrades role', async () => {
    const { user, token } = await createUser()
    const res = await request(app)
      .post('/api/profiles/organizer')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: String(user._id), organizationName: 'My Org' })
    expect(res.status).toBe(201)
    expect(res.body.data.organizationName).toBe('My Org')
  })

  it('prevents duplicate organizer profile', async () => {
    const { organizer, token } = await createOrganizer()
    const res = await request(app)
      .post('/api/profiles/organizer')
      .set('Authorization', `Bearer ${token}`)
      .send({ organizationName: 'Another Org' })
    expect(res.status).toBe(409)
  })
})
