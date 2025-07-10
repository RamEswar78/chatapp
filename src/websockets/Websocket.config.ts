import { WebSocket, WebSocketServer } from "ws";
import { Server as HttpServer, IncomingMessage } from "http";
import { connectionHandler } from "./handlers/connectionHandler";
import { User } from "@prisma/client";

export function createWebSocketServer(server: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ server }); // Specify the port or use the server's port

  wss.on("connection", async (ws: WebSocket, req: IncomingMessage) => {
    await connectionHandler(ws, req);
  });

  console.log(`WebSocket server is running on ws://localhost:3000`); // Adjust the port as necessary
  return wss;
}
