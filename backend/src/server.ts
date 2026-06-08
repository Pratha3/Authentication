import express from 'express'
import cors from 'cors'
import path from 'path'
import { createServer } from 'http'
import { env } from './config/env'
import { connectDB } from './config/db'
import { securityHeaders } from './middleware/security'
// Eagerly register all Mongoose models so .populate() works across any route
import './models/User'
import './models/Profile'
import './models/Organizer'
import './models/Venue'
import './models/Event'
import './models/Registration'
import './models/Bookmark'
import './models/Notification'
import './models/NotificationLog'
import './models/ChatMessage'
import './models/Review'
import authRoutes from './routes/authRoutes'
import eventRoutes from './routes/eventRoutes'
import profileRoutes from './routes/profileRoutes'
import registrationRoutes from './routes/registrationRoutes'
import bookmarkRoutes from './routes/bookmarkRoutes'
import notificationRoutes from './routes/notificationRoutes'
import uploadRoutes from './routes/uploadRoutes'
import aiRoutes from './routes/aiRoutes'
import reviewRoutes from './routes/reviewRoutes'
import { initSockets } from './sockets/io'
import { startQueueWorker } from './services/notification-queue.service'
import { startReminderJob } from './jobs/reminder.job'

const app = express()

app.use(securityHeaders)

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  env.CLIENT_URL,
].filter(Boolean) as string[]
const devOriginPattern = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/

app.use(cors({
  origin: (origin, cb) =>
    !origin || allowedOrigins.includes(origin) || (env.NODE_ENV !== 'production' && devOriginPattern.test(origin))
      ? cb(null, true)
      : cb(null, false),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/profiles', profileRoutes)
app.use('/api/registrations', registrationRoutes)
app.use('/api/bookmarks', bookmarkRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/reviews', reviewRoutes)
// No test routes mounted

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use((_req, res) => res.status(404).json({ message: 'Route not found.' }))

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err.message)
  res.status(500).json({ message: 'Internal server error.' })
})

const httpServer = createServer(app)
initSockets(httpServer)

connectDB().then(() => {
  startQueueWorker()
  startReminderJob()
})

if (env.NODE_ENV !== 'test') {
  httpServer.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT}`)
  })
}

export { app }
