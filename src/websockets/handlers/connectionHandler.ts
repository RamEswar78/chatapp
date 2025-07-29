import { addUserSocket, removeSocketUser } from "./UserHandler";
import WebSocket from "ws";
import { IncomingMessage } from "http";
import { verifyToken } from "../../utils/jwt";
import { handleMessage } from "./messages/handleMessages";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export function connectionHandler(ws: WebSocket, req: IncomingMessage): void {
  // Log the connection
  const url = new URL(req.url!, "http://localhost");
  const token: string | null = url.searchParams.get("token");

  if (!token) {
    console.error("Authentication token is required");
    ws.close(1008, "Authentication failed, token is required");
    return;
  }

  console.log("New client attempting to connect");

  // Verify the token
  const decodedToken = verifyToken(token);
  if (!decodedToken) {
    console.error("Invalid token");
    ws.close(1008, "Authentication failed, invalid token");
    return;
  }

  const userId = decodedToken.userId;
  console.log(`User ${userId} connected via WebSocket`);

  // Add the user socket to the map
  addUserSocket(userId, ws);

  // Update user's last seen
  updateUserLastSeen(parseInt(userId));

  // Send a welcome message to the client
  ws.send(
    JSON.stringify({
      type: "connected",
      message: "Successfully connected to chat server",
      userId: userId,
    })
  );

  // Handle incoming messages from the client
  ws.on("message", (message: string) => {
    console.log(`Received message from user ${userId}: ${message}`);
    handleMessage(message, ws);
  });

  // Handle client disconnection
  ws.on("close", () => {
    console.log(`User ${userId} disconnected`);
    removeSocketUser(ws);
    updateUserLastSeen(parseInt(userId));
  });

  // Handle WebSocket errors
  ws.on("error", (error) => {
    console.error(`WebSocket error for user ${userId}:`, error);
    removeSocketUser(ws);
  });
}

async function updateUserLastSeen(userId: number): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { lastSeen: new Date() },
    });
  } catch (error) {
    console.error(`Failed to update last seen for user ${userId}:`, error);
  }
}
