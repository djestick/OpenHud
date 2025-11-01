import { Server } from "socket.io";
import http from "http";
import { getLatestGameDataSnapshot } from "../gsi/gsi.js";

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

  // IO sends to all clients including sender
  // socket.broadcast.emit sends to all clients except sender
  // socket.emit sends to the sender only

  io.on("connection", (socket) => {
    socket.emit("update", { data: "Initial data from server" });

    socket.on("match", () => {
      console.log("test");
    });

    socket.on("refreshHUD", () => {
      // Broadcast to all connected clients including sender
      io.emit("refreshHUD");
    });

    socket.on("refreshDashboard", () => {
      const { data, timestamp } = getLatestGameDataSnapshot();
      const isStale = !timestamp || Date.now() - timestamp > 1000;
      if (!data || isStale) {
        socket.emit("dashboard:clear");
        return;
      }
      socket.emit("update", data);
    });
  });

  return io;
}
