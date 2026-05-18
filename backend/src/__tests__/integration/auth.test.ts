/**
 * AUTH-001 … AUTH-010
 * Integration tests for /api/auth endpoints.
 */
import request from 'supertest'
import { app } from '../../server'
import { connectTestDB, clearTestDB, closeTestDB } from '../setup/db'
import { createUser, makeToken } from '../setup/fixtures'
import { User } from '../../models/User'
import { Profile } from '../../models/Profile'



beforeAll(async () => { await connectTestDB() })
afterEach(async () => { await clearTestDB() })
afterAll(async () => { await closeTestDB() })

// ─── AUTH-001: Register with valid credentials ────────────────────────────────
describe('POST /api/auth/signup', () => {
  it('AUTH-001 creates account with valid email+password', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      email: 'newuser@test.com', password: 'Password123!', name: 'New User',
    })
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('token')
    expect(res.body.user.email).toBe('newuser@test.com')

    const saved = await User.findOne({ email: 'newuser@test.com' })
    expect(saved).not.toBeNull()

    const profile = await Profile.findOne({ email: 'newuser@test.com' })
    expect(profile).not.toBeNull()
    expect(profile?.role).toBe('user')
  })

  // AUTH-002: Duplicate email
  it('AUTH-002 rejects duplicate email', async () => {
    await createUser({ email: 'dup@test.com' })
    const res = await request(app).post('/api/auth/signup').send({
      email: 'dup@test.com', password: 'Password123!',
    })
    expect(res.status).toBe(409)
    expect(res.body.message).toMatch(/already exists/i)
  })

  // AUTH-003: Short password (backend uses min 6 chars)
  it('AUTH-003 rejects password shorter than minimum', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      email: 'short@test.com', password: '123',
    })
    expect(res.status).toBeGreaterThanOrEqual(400)
  })

  // AUTH-004: Invalid email format (validation middleware)
  it('AUTH-004 rejects invalid email format', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      email: 'not-an-email', password: 'Password123!',
    })
    expect(res.status).toBeGreaterThanOrEqual(400)
  })
})

// ─── AUTH-006/007: Login + session ───────────────────────────────────────────
describe('POST /api/auth/login', () => {
  it('AUTH-006 returns JWT on valid credentials', async () => {
    const { user, plainPassword } = await createUser({ email: 'login@test.com' })
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@test.com', password: plainPassword,
    })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
    expect(res.body.user.id).toBeDefined()
  })

  it('rejects wrong password', async () => {
    await createUser({ email: 'wrongpass@test.com' })
    const res = await request(app).post('/api/auth/login').send({
      email: 'wrongpass@test.com', password: 'WrongPassword!',
    })
    expect(res.status).toBe(401)
  })

  it('rejects non-existent user', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'ghost@test.com', password: 'Password123!',
    })
    expect(res.status).toBe(401)
  })
})

// ─── AUTH-008: Protected route without token ──────────────────────────────────
describe('GET /api/auth/me', () => {
  it('AUTH-008 rejects request without Authorization header', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('AUTH-009 rejects tampered/expired token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.here')
    expect(res.status).toBe(401)
  })

  it('returns user for valid token', async () => {
    const { user, token } = await createUser()
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe(user.email)
  })
})

// ─── AUTH-010: Role-based access ─────────────────────────────────────────────
describe('Role-based access control', () => {
  it('AUTH-010 organizer cannot reach admin-only endpoint', async () => {
    const { token } = await createUser({ role: 'organizer' })
    const res = await request(app)
      .get('/api/profiles/admin/users')
      .set('Authorization', `Bearer ${token}`)
    // Admin route returns 403 for non-admins
    expect([401, 403]).toContain(res.status)
  })
})

// ─── Password reset flow ──────────────────────────────────────────────────────
describe('Password reset', () => {
  it('forgot-password returns 200 whether email exists or not (no enumeration)', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({
      email: 'anyone@test.com',
    })
    expect(res.status).toBe(200)
  })

  it('reset with invalid token returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password/badtoken')
      .send({ password: 'NewPassword123!' })
    expect(res.status).toBe(400)
  })
})
