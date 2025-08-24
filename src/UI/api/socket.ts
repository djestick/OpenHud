import { io } from "socket.io-client";
import { CSGOGSI } from "csgogsi";
import { port } from "./api";

export const socket = io(`localhost:${port}`);
export const GSI = new CSGOGSI();

socket.on("update", (data) => {
  GSI.digest(data);
});
