import { Server } from "socket.io";
import { clientOrigins } from "./config/env.js";
import { verifyAccessToken } from "./modules/auth/auth.tokens.js";

let io;

export function createSocketServer(httpServer) {
  io = new Server(httpServer, { cors: { origin: clientOrigins, credentials: true } });
  io.use((socket, next) => {
    try {
      const payload = verifyAccessToken(socket.handshake.auth?.token);
      socket.userId = payload.sub;
      next();
    } catch { next(new Error("Authentication required")); }
  });
  io.on("connection", (socket) => {
    socket.join(`user:${socket.userId}`);
    console.log(`Authenticated socket connected: ${socket.id}`);
    socket.on("disconnect", () => console.log(`Socket disconnected: ${socket.id}`));
  });
  return io;
}

export function emitToUser(userId, event, payload) {
  io?.to(`user:${userId}`).emit(event, payload);
}
