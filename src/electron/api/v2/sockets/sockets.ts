import { Server } from "socket.io";
import http from "http";

export let io: Server;

/**
 * Initialize a socketio websocket server.
 */
export function initializeWebSocket(server: http.Server) {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected");
    socket.emit("update", { data: "Initial data from server" });
    socket.on("match", () => {
      console.log("test");
    });
    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });

  return io;
}
