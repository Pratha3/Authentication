import { Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";

export const initSockets = (httpServer: HttpServer): SocketServer => {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("new_user_joined", (email: string) => {
      (socket as any).userEmail = email;
      const notificationMessage = `A new user ${email} just joined!`;
      console.log(`[SOCKET EVENT] ${notificationMessage} (Socket: ${socket.id})`);
      io.emit("receive_notification", notificationMessage);
    });

    socket.on("disconnect", () => {
      const email = (socket as any).userEmail || "Anonymous / Not Logged In";
      console.log(`User disconnected: ${socket.id} (Email: ${email})`);
    });
  });

  return io;
};
