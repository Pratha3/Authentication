import { MongoMemoryServer } from 'mongodb-memory-server'

export default async function globalSetup() {
  const mongod = await MongoMemoryServer.create()
  process.env.MONGO_URI = mongod.getUri()
  process.env.JWT_SECRET = 'test-secret-key-for-jest-only'
  process.env.JWT_EXPIRES_IN = '1h'
  process.env.BACKEND_URL = 'http://localhost:5000'
  ;(global as any).__MONGOD__ = mongod
}
