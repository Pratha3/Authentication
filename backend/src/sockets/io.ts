import { Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import { Event } from "../models/Event";
import { ChatMessage } from "../models/ChatMessage";

let io: SocketServer;

export const getIO = (): SocketServer => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

export const initSockets = (httpServer: HttpServer): SocketServer => {
  const allowedOrigins = [
    process.env.CLIENT_URL ?? "http://localhost:3000",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ];
  const devOriginPattern = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

  io = new SocketServer(httpServer, {
    cors: {
      origin: (origin, cb) => {
        if (
          !origin ||
          allowedOrigins.includes(origin) ||
          (process.env.NODE_ENV !== "production" && devOriginPattern.test(origin))
        ) {
          cb(null, true);
          return;
        }
        cb(null, false);
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
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

    // ── Live Chat room: real-time event discussion ───────────────────────
    socket.on("join_chat", async (payload: { eventId: string; userId: string }) => {
      const { eventId, userId } = payload;
      socket.join(`chat:${eventId}`);
      try {
        const messages = await ChatMessage.find({ eventId })
          .sort({ createdAt: 1 })
          .limit(50)
          .lean();
        socket.emit("chat_history", { eventId, messages });
      } catch {}
    });

    socket.on("leave_chat", (eventId: string) => {
      socket.leave(`chat:${eventId}`);
    });

    socket.on("send_chat_message", async (payload: { eventId: string; userId: string; userName: string; text: string }) => {
      const { eventId, userId, userName, text } = payload;
      try {
        const newMessage = await ChatMessage.create({
          eventId,
          userId,
          userName,
          text,
        });
        io.to(`chat:${eventId}`).emit("new_chat_message", newMessage);
      } catch (err) {
        socket.emit("chat_error", { message: "Failed to send message" });
      }
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
