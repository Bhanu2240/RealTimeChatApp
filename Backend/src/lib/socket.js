import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://18.208.197.41",
];
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
  // IMPORTANT
  transports: ["websocket"],
});
// userId => socketId
const userSocketMap = new Map();
export function getReceiverSocketId(userId) {
  return userSocketMap.get(String(userId));
}
io.on("connection", (socket) => {
  console.log("=================================");
  console.log("NEW SOCKET CONNECTED");
  console.log("Socket ID:", socket.id);
  const userId =
    socket.handshake.auth?.userId ||
    socket.handshake.query?.userId;
  console.log("User ID:", userId);
  // save user socket
  if (userId) {
    userSocketMap.set(String(userId), socket.id);
  }
  console.log("ONLINE USERS:",Object.fromEntries(userSocketMap));
  // send online users
  io.emit("getOnlineUsers",Array.from(userSocketMap.keys()));
  socket.on("disconnect", (reason) => {
    console.log("=================================");
    console.log("SOCKET DISCONNECTED");
    console.log("Socket ID:", socket.id);
    console.log("Reason:", reason);
    if (
  userSocketMap.get(String(userId)) ===
  socket.id
) {
  userSocketMap.delete(String(userId));
}
    console.log("ONLINE USERS AFTER DISCONNECT:", Object.fromEntries(userSocketMap) );
    io.emit("getOnlineUsers",Array.from(userSocketMap.keys()));
  });
});

export { io, app, server };