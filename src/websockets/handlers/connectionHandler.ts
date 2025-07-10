import { addUserSocket } from "./UserHandler";
import WebSocket from "ws";
import { User } from "@prisma/client";
import { IncomingMessage } from "http";
import { verifyToken } from "../../utils/jwt";
import { handleMessage } from "./messages/handleMessages";

export function connectionHandler(ws: WebSocket, req: IncomingMessage): void {
  // Log the connection
  const url = new URL(req.url!, "http://localhost");
  const userName: string | null = url.searchParams.get("userName");
  // const token: string | null = url.searchParams.get("token");

  // if (!token) {
  //   console.error("Authentication token is required");
  //   ws.close(1008, "Authentiation failed, token is required");
  // }

  console.log("New client connected");
  // const decodedToken = verifyToken(token as string);
  // if (!decodedToken) {
  //   console.error("Invalid token");
  //   ws.close(1008, "Authentication failed, invalid token");
  //   return;
  // }
  // const userName = decodedToken.userName;

  //adding the user socket to the map
  addUserSocket(userName as string, ws);

  // Send a welcome message to the client
  ws.send(JSON.stringify({ message: "Welcome to the WebSocket server!" }));

  // Handle incoming messages from the client
  ws.on("message", (message: string) => {
    console.log(`Received message: ${message}`);
    handleMessage(message, ws, userName as string);
  });

  // Handle client disconnection
  ws.on("close", () => {
    console.log("Client disconnected");
  });
}
