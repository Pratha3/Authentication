import { io, type Socket } from 'socket.io-client'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:5000'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(BACKEND_URL, { autoConnect: false, withCredentials: true })
  }
  return socket
}

export function connectSocket(): Socket {
  const s = getSocket()
  if (!s.connected) s.connect()
  return s
}

export function disconnectSocket() {
  socket?.disconnect()
}

// ── Event rooms ──────────────────────────────────────────────────────────────

export interface AttendeeUpdate {
  eventId: string
  count: number
  capacity: number | null
  status: string
}

export function subscribeToEventUpdates(
  eventId: string,
  onAttendeeChange: (count: number) => void,
  onStatusChange: (status: string) => void
): () => void {
  const s = connectSocket()
  s.emit('join_event', eventId)

  const handleAttendee = (data: AttendeeUpdate) => {
    if (data.eventId === eventId) {
      onAttendeeChange(data.count)
      onStatusChange(data.status)
    }
  }
  const handleStatus = (data: { eventId: string; status: string }) => {
    if (data.eventId === eventId) onStatusChange(data.status)
  }

  s.on('attendee_update', handleAttendee)
  s.on('status_update', handleStatus)

  return () => {
    s.emit('leave_event', eventId)
    s.off('attendee_update', handleAttendee)
    s.off('status_update', handleStatus)
  }
}

// ── User notification room ────────────────────────────────────────────────────

export function subscribeToUserNotifications(
  userId: string,
  onNotification: (n: unknown) => void
): () => void {
  const s = connectSocket()
  s.emit('join_user', userId)
  s.on('notification', onNotification)

  return () => {
    s.emit('leave_user', userId)
    s.off('notification', onNotification)
  }
}
