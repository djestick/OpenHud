import express from "express";
import cors from "cors";
import { createServer, Server } from "http";
import { APIRouter } from "./api/v2/api.router.js";
import { initializeWebSocket, io } from "./api/v2/sockets/sockets.js";
import { DevRouter } from "./configs/dev.js";
import { checkDirectories } from "./api/v2/helpers/utilities.js";

export const PORT = process.env.PORT || "1349";
export const expressApp = express();
export const server: Server = createServer(expressApp);

export const apiUrl = `localhost:${PORT}`;

export const startServer = () => {
  /* Initialize express app, http server, and websocket server with default or environment port*/
  initializeWebSocket(server);

  checkDirectories();

  /* Implement CORs and json to the express app */
  expressApp.use(cors());
  expressApp.use(express.json());

  /* Specify routes */
  expressApp.use("/api", APIRouter);
  expressApp.use("/development", DevRouter);

  /* Print express server successfully started and listening on specified port */
  server.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`);
  });
};

export const closeServer = () => {
  if (io) {
    io.close();
  }
  server.close(() => {
    console.log("Server closed");
  });
};

