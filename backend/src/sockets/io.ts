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
    process.env.CLIENT_URL || "http://localhost:3000",
    "http://localhost:3000",
    "http://localhost:5173",
  ];

  io = new SocketServer(httpServer, {
    cors: { origin: allowedOrigins, methods: ["GET", "POST"], credentials: true },
  });

  io.on("connection", (socket) => {
    // Join a room for a specific event to get live attendee updates
    socket.on("join_event", async (eventId: string) => {
      socket.join(`event:${eventId}`);
      try {
        const event = await Event.findById(eventId).select("currentAttendees capacity status").lean();
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

    // Join a room for personal notifications
    socket.on("join_user", (userId: string) => {
      socket.join(`user:${userId}`);
    });

    socket.on("leave_user", (userId: string) => {
      socket.leave(`user:${userId}`);
    });

    socket.on("disconnect", () => {});
  });

  return io;
};

// Helpers to emit from controllers
export const emitAttendeeUpdate = (
  eventId: string,
  count: number,
  capacity: number | null,
  status: string
) => {
  io?.to(`event:${eventId}`).emit("attendee_update", { eventId, count, capacity, status });
};

export const emitEventStatusUpdate = (eventId: string, status: string) => {
  io?.to(`event:${eventId}`).emit("status_update", { eventId, status });
};

export const emitUserNotification = (userId: string, notification: object) => {
  io?.to(`user:${userId}`).emit("notification", notification);
};
