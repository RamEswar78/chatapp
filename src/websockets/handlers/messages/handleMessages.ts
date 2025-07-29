import { WebSocket } from "ws";
import { Message } from "../../../models/message";
import { getUserSocket, getUserId } from "../UserHandler";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface WebSocketMessage {
  type: "onetoone" | "group";
  chatId: number;
  message: string;
  receiverId?: number;
}

export async function handleMessage(
  message: string,
  ws: WebSocket
): Promise<void> {
  try {
    // Parse the incoming message
    const parsedMessage: WebSocketMessage = JSON.parse(message);

    // Get sender ID from WebSocket
    const senderId = getUserId(ws);
    if (!senderId) {
      ws.send(
        JSON.stringify({ error: "Unauthorized - please authenticate first" })
      );
      return;
    }

    // Handle different types of messages based on the type property
    switch (parsedMessage.type) {
      case "onetoone":
        await handleOneToOneMessage(parsedMessage, ws, senderId);
        break;

      case "group":
        await handleGroupMessage(parsedMessage, ws, senderId);
        break;

      default:
        console.error(`Unknown message type: ${parsedMessage.type}`);
        ws.send(JSON.stringify({ error: "Unknown message type" }));
    }
  } catch (error) {
    console.error("Error handling message:", error);
    ws.send(JSON.stringify({ error: "Invalid message format" }));
  }
}

async function handleOneToOneMessage(
  parsedMessage: WebSocketMessage,
  ws: WebSocket,
  senderId: number
): Promise<void> {
  try {
    // Validate chat exists and user is participant
    const chat = await prisma.chat.findFirst({
      where: {
        id: parsedMessage.chatId,
        participants: {
          some: {
            userId: senderId,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, username: true },
            },
          },
        },
      },
    });

    if (!chat) {
      ws.send(JSON.stringify({ error: "Chat not found or unauthorized" }));
      return;
    }

    // Save message to database
    const savedMessage = await prisma.message.create({
      data: {
        content: parsedMessage.message,
        senderId: senderId,
        chatId: parsedMessage.chatId,
        createdAt: new Date(),
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // Prepare message to send
    const messageToSend = {
      type: "message",
      data: {
        id: savedMessage.id,
        content: savedMessage.content,
        senderId: savedMessage.senderId,
        senderUsername: savedMessage.sender.username,
        chatId: savedMessage.chatId,
        createdAt: savedMessage.createdAt,
        isRead: false,
      },
    };

    // Send to all participants
    const participants = chat.participants.filter((p) => p.isActive);
    participants.forEach((participant) => {
      const participantSocket = getUserSocket(participant.user.id);
      if (
        participantSocket &&
        participantSocket.readyState === WebSocket.OPEN
      ) {
        participantSocket.send(JSON.stringify(messageToSend));
      }
    });

    console.log(
      `Message sent in chat ${parsedMessage.chatId} by user ${senderId}`
    );
  } catch (error) {
    console.error("Error handling one-to-one message:", error);
    ws.send(JSON.stringify({ error: "Failed to send message" }));
  }
}

async function handleGroupMessage(
  parsedMessage: WebSocketMessage,
  ws: WebSocket,
  senderId: number
): Promise<void> {
  try {
    // Similar to one-to-one but for group chats
    // This can be implemented later when group chat functionality is needed
    ws.send(JSON.stringify({ error: "Group messages not implemented yet" }));
  } catch (error) {
    console.error("Error handling group message:", error);
    ws.send(JSON.stringify({ error: "Failed to send group message" }));
  }
}
