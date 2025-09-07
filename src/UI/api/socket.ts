import { io } from "socket.io-client";
import { CSGOGSI } from "csgogsi";
import { port } from "./api";

export const socket = io(`http://localhost:${port}`);
export const GSI = new CSGOGSI();

socket.on("update", (data) => {
  GSI.digest(data);
});
