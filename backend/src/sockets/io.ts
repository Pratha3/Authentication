import { Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import { Event } from "../models/Event";

let io: SocketServer;

export const getIO = (): SocketServer => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

export const initSockets = (httpServer: HttpServer): SocketServer => {
  const allowedOrigins = [
    process.env.CLIENT_URL ?? "http://localhost:3000",
    "http://localhost:3000",
    "http://localhost:5173",
  ];

  io = new SocketServer(httpServer, {
    cors: { origin: allowedOrigins, methods: ["GET", "POST"], credentials: true },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on("connection", (socket) => {
    // ── Event room: live attendee count & status ──────────────────────────
    socket.on("join_event", async (eventId: string) => {
      socket.join(`event:${eventId}`);
      try {
        const event = await Event.findById(eventId)
          .select("currentAttendees capacity status title")
          .lean();
        if (event) {
          socket.emit("attendee_update", {
            eventId,
            count: event.currentAttendees,
            capacity: event.capacity,
            status: event.status,
          });
        }
      } catch {}
    });

    socket.on("leave_event", (eventId: string) => {
      socket.leave(`event:${eventId}`);
    });

    // ── User room: personal in-app notifications ──────────────────────────
    socket.on("join_user", (userId: string) => {
      socket.join(`user:${userId}`);
    });

    socket.on("leave_user", (userId: string) => {
      socket.leave(`user:${userId}`);
    });

    // ── Organizer room: live dashboard updates ────────────────────────────
    socket.on("join_organizer", (userId: string) => {
      socket.join(`organizer:${userId}`);
    });

    socket.on("leave_organizer", (userId: string) => {
      socket.leave(`organizer:${userId}`);
    });

    socket.on("disconnect", (reason) => {
      // Socket.io handles room cleanup automatically on disconnect
    });
  });

  return io;
};

// ─── Emitter helpers (called from controllers) ────────────────────────────

export const emitAttendeeUpdate = (
  eventId: string,
  count: number,
  capacity: number | null,
  status: string
): void => {
  io?.to(`event:${eventId}`).emit("attendee_update", { eventId, count, capacity, status });
};

export const emitEventStatusUpdate = (eventId: string, status: string): void => {
  io?.to(`event:${eventId}`).emit("status_update", { eventId, status });
};

export const emitUserNotification = (userId: string, notification: object): void => {
  io?.to(`user:${userId}`).emit("notification", notification);
};

export const emitOrganizerDashboardUpdate = (
  organizerUserId: string,
  payload: {
    type: "new_registration" | "cancellation" | "status_change";
    eventId: string;
    attendeeName?: string;
    attendeeCount?: number;
    status?: string;
    registrationId?: string;
  }
): void => {
  io?.to(`organizer:${organizerUserId}`).emit("dashboard_update", payload);
};
