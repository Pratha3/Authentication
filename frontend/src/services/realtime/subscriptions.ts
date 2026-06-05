/**
 * Socket.io client — singleton with safe room management.
 *
 * Root cause of 400 Bad Request:
 *   Emitting room-join events (e.g. join_event) BEFORE the socket finishes
 *   its handshake gives the server an unknown or stale session ID.
 *
 * Fix: every subscribe function waits for the `connect` event before
 * emitting the room join, and re-joins automatically after a reconnect.
 */

import { io, type Socket } from 'socket.io-client'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:5000'

let _socket: Socket | null = null

// ── Singleton factory ─────────────────────────────────────────────────────────

function getSocket(): Socket {
  if (!_socket || _socket.disconnected) {
    // Destroy stale instance so we get a fresh handshake
    _socket?.removeAllListeners()
    _socket?.disconnect()

    _socket = io(BACKEND_URL, {
      withCredentials: true,
      // Let Socket.io manage the connection lifecycle
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      // Start with polling, upgrade to WS — matches the server default
      transports: ['polling', 'websocket'],
    })

    _socket.on('connect_error', (err) => {
      // Only log in dev; don't throw so the app keeps running
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[socket] connect_error:', err.message)
      }
    })
  }
  return _socket
}

/**
 * Emit a room-join event safely and re-join after reconnects.
 * Returns a cleanup fn that unregisters the connect listener.
 */
function joinRoom(s: Socket, event: string, payload: unknown): () => void {
  const handler = () => s.emit(event, payload)
  if (s.connected) handler()
  s.on('connect', handler)
  return () => s.off('connect', handler)
}

export function disconnectSocket(): void {
  _socket?.disconnect()
  _socket = null
}

// ── Event room: live attendee count + status ──────────────────────────────────

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
  const s = getSocket()

  // Join the room (deferred if not yet connected)
  const cleanupJoin = joinRoom(s, 'join_event', eventId)

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
    cleanupJoin()
    s.off('attendee_update', handleAttendee)
    s.off('status_update', handleStatus)
    if (s.connected) s.emit('leave_event', eventId)
  }
}

// ── User notification room ────────────────────────────────────────────────────

export function subscribeToUserNotifications(
  userId: string,
  onNotification: (n: unknown) => void
): () => void {
  const s = getSocket()

  const cleanupJoin = joinRoom(s, 'join_user', userId)
  s.on('notification', onNotification)

  return () => {
    cleanupJoin()
    s.off('notification', onNotification)
    if (s.connected) s.emit('leave_user', userId)
  }
}

// ── Organizer dashboard room ─────────────────────────────────────────────────

export interface OrganizerDashboardUpdate {
  type: 'new_registration' | 'cancellation' | 'status_change'
  eventId: string
  attendeeName?: string
  attendeeCount?: number
  status?: string
  registrationId?: string
}

export function subscribeToOrganizerDashboard(
  organizerUserId: string,
  onUpdate: (data: OrganizerDashboardUpdate) => void
): () => void {
  const s = getSocket()

  const cleanupJoin = joinRoom(s, 'join_organizer', organizerUserId)
  s.on('dashboard_update', onUpdate)

  return () => {
    cleanupJoin()
    s.off('dashboard_update', onUpdate)
    if (s.connected) s.emit('leave_organizer', organizerUserId)
  }
}

// ── Chat room: real-time event discussion ──────────────────────────────────────

export interface ChatMessageData {
  _id: string
  eventId: string
  userId: string
  userName: string
  text: string
  createdAt: string
}

export function subscribeToEventChat(
  eventId: string,
  userId: string,
  onHistory: (messages: ChatMessageData[]) => void,
  onNewMessage: (msg: ChatMessageData) => void
): {
  sendMessage: (userName: string, text: string) => void
  unsubscribe: () => void
} {
  const s = getSocket()

  const payload = { eventId, userId }
  const cleanupJoin = joinRoom(s, 'join_chat', payload)

  const handleHistory = (data: { eventId: string; messages: ChatMessageData[] }) => {
    if (data.eventId === eventId) {
      onHistory(data.messages)
    }
  }

  const handleNewMessage = (msg: ChatMessageData) => {
    if (msg.eventId === eventId) {
      onNewMessage(msg)
    }
  }

  s.on('chat_history', handleHistory)
  s.on('new_chat_message', handleNewMessage)

  return {
    sendMessage: (userName: string, text: string) => {
      s.emit('send_chat_message', { eventId, userId, userName, text })
    },
    unsubscribe: () => {
      cleanupJoin()
      s.off('chat_history', handleHistory)
      s.off('new_chat_message', handleNewMessage)
      if (s.connected) s.emit('leave_chat', eventId)
    }
  }
}
