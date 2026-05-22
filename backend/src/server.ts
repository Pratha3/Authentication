import express from 'express'
import cors from 'cors'
import path from 'path'
import { createServer } from 'http'
import dotenv from 'dotenv'
import { connectDB } from './config/db'
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
import authRoutes from './routes/authRoutes'
import eventRoutes from './routes/eventRoutes'
import profileRoutes from './routes/profileRoutes'
import registrationRoutes from './routes/registrationRoutes'
import bookmarkRoutes from './routes/bookmarkRoutes'
import notificationRoutes from './routes/notificationRoutes'
import uploadRoutes from './routes/uploadRoutes'
import testRoutes from './routes/testRoutes'
import aiRoutes from './routes/aiRoutes'
import { initSockets } from './sockets/io'
import { startQueueWorker } from './services/notification-queue.service'
import { startReminderJob } from './jobs/reminder.job'

dotenv.config()

const app = express()

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.CLIENT_URL,
].filter(Boolean) as string[]

app.use(cors({
  origin: (origin, cb) =>
    !origin || allowedOrigins.includes(origin) ? cb(null, true) : cb(null, false),
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
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/test', testRoutes)
}

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

if (process.env.NODE_ENV !== 'test') {
  const PORT = Number(process.env.PORT) || 5000
  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

export { app }