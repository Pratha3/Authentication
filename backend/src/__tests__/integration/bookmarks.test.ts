/**
 * USER-008 / USER-009 — Bookmark add & remove.
 */
import request from 'supertest'
import { app } from '../../server'
import { connectTestDB, clearTestDB, closeTestDB } from '../setup/db'
import { createUser, createOrganizer, createEvent } from '../setup/fixtures'



beforeAll(async () => { await connectTestDB() })
afterEach(async () => { await clearTestDB() })
afterAll(async () => { await closeTestDB() })

describe('Bookmarks API', () => {
  it('USER-008 adds a bookmark', async () => {
    const { organizer } = await createOrganizer()
    const evt = await createEvent(String(organizer._id))
    const { token } = await createUser()

    const res = await request(app)
      .post('/api/bookmarks')
      .set('Authorization', `Bearer ${token}`)
      .send({ eventId: String((evt as any)._id) })

    expect(res.status).toBe(201)
    expect(res.body.data).toBeDefined()
  })

  it('prevents duplicate bookmark', async () => {
    const { organizer } = await createOrganizer()
    const evt = await createEvent(String(organizer._id))
    const { token } = await createUser()

    await request(app)
      .post('/api/bookmarks')
      .set('Authorization', `Bearer ${token}`)
      .send({ eventId: String((evt as any)._id) })

    const res = await request(app)
      .post('/api/bookmarks')
      .set('Authorization', `Bearer ${token}`)
      .send({ eventId: String((evt as any)._id) })
    expect(res.status).toBe(409)
  })

  it('USER-009 removes a bookmark', async () => {
    const { organizer } = await createOrganizer()
    const evt = await createEvent(String(organizer._id))
    const { token } = await createUser()

    await request(app)
      .post('/api/bookmarks')
      .set('Authorization', `Bearer ${token}`)
      .send({ eventId: String((evt as any)._id) })

    const del = await request(app)
      .delete(`/api/bookmarks/${(evt as any)._id}`)
      .set('Authorization', `Bearer ${token}`)
    expect(del.status).toBe(200)

    const list = await request(app)
      .get('/api/bookmarks')
      .set('Authorization', `Bearer ${token}`)
    expect(list.body.data).toHaveLength(0)
  })

  it('GET /api/bookmarks lists user bookmarks', async () => {
    const { organizer } = await createOrganizer()
    const evt1 = await createEvent(String(organizer._id), { slug: 'bm1' })
    const evt2 = await createEvent(String(organizer._id), { slug: 'bm2' })
    const { token } = await createUser()

    await request(app).post('/api/bookmarks').set('Authorization', `Bearer ${token}`).send({ eventId: String((evt1 as any)._id) })
    await request(app).post('/api/bookmarks').set('Authorization', `Bearer ${token}`).send({ eventId: String((evt2 as any)._id) })

    const res = await request(app).get('/api/bookmarks').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(2)
  })

  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/api/bookmarks')
    expect(res.status).toBe(401)
  })
})
