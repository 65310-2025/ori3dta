import socketIOClient, { Socket } from "socket.io-client";

import { post } from "./utils/requests";

const endpoint: string = `${window.location.hostname}:${window.location.port}`;
export const socket: Socket = socketIOClient(endpoint);

socket.on("connect", () => {
  post("/api/initsocket", { socketid: socket.id });
});
