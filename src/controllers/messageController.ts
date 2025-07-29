import { Request, Response } from "express";
import { PrismaClient, MessageType } from "@prisma/client";
import { AuthRequest } from "../middlewares/AuthMiddleware";

const prisma = new PrismaClient();

export const getChatMessages = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const currentUserId = parseInt(req.user.userId);

    if (isNaN(parseInt(chatId))) {
      res.status(400).json({ error: "Invalid chat ID" });
      return;
    }

    // Verify user is participant of the chat
    const chatParticipant = await prisma.chatParticipant.findFirst({
      where: {
        chatId: parseInt(chatId),
        userId: currentUserId,
        isActive: true,
      },
    });

    if (!chatParticipant) {
      res.status(403).json({ error: "You are not a participant of this chat" });
      return;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const messages = await prisma.message.findMany({
      where: {
        chatId: parseInt(chatId),
        isDeleted: false,
      },
      include: {
        sender: {
          select: { id: true, username: true, avatarUrl: true },
        },
        replyToMessage: {
          select: {
            id: true,
            content: true,
            sender: {
              select: { id: true, username: true },
            },
          },
        },
        readStatus: {
          include: {
            user: {
              select: { id: true, username: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: parseInt(limit as string),
    });

    // Mark messages as read for current user
    const unreadMessageIds = messages
      .filter(
        (msg) => !msg.readStatus.some((rs) => rs.userId === currentUserId)
      )
      .map((msg) => msg.id);

    if (unreadMessageIds.length > 0) {
      await prisma.messageReadStatus.createMany({
        data: unreadMessageIds.map((messageId) => ({
          messageId,
          userId: currentUserId,
        })),
        skipDuplicates: true,
      });
    }

    res.json(messages.reverse()); // Return in chronological order
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get chat messages" });
  }
};

export const sendMessage = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { chatId } = req.params;
    const {
      content,
      messageType = "text",
      fileUrl,
      fileName,
      fileSize,
      replyToMessageId,
    } = req.body;
    const currentUserId = parseInt(req.user.userId);

    if (isNaN(parseInt(chatId))) {
      res.status(400).json({ error: "Invalid chat ID" });
      return;
    }

    if (!content || content.trim().length === 0) {
      res.status(400).json({ error: "Message content is required" });
      return;
    }

    // Verify user is participant of the chat
    const chatParticipant = await prisma.chatParticipant.findFirst({
      where: {
        chatId: parseInt(chatId),
        userId: currentUserId,
        isActive: true,
      },
    });

    if (!chatParticipant) {
      res.status(403).json({ error: "You are not a participant of this chat" });
      return;
    }

    // Verify reply message exists if provided
    if (replyToMessageId) {
      const replyMessage = await prisma.message.findFirst({
        where: {
          id: parseInt(replyToMessageId),
          chatId: parseInt(chatId),
        },
      });

      if (!replyMessage) {
        res.status(400).json({ error: "Reply message not found" });
        return;
      }
    }

    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        messageType: messageType as MessageType,
        fileUrl,
        fileName,
        fileSize: fileSize ? parseInt(fileSize) : null,
        replyToMessageId: replyToMessageId ? parseInt(replyToMessageId) : null,
        chatId: parseInt(chatId),
        senderId: currentUserId,
      },
      include: {
        sender: {
          select: { id: true, username: true, avatarUrl: true },
        },
        replyToMessage: {
          select: {
            id: true,
            content: true,
            sender: {
              select: { id: true, username: true },
            },
          },
        },
      },
    });

    // Update chat's updatedAt timestamp
    await prisma.chat.update({
      where: { id: parseInt(chatId) },
      data: { updatedAt: new Date() },
    });

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

export const editMessage = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { messageId } = req.params;
    const { content } = req.body;
    const currentUserId = parseInt(req.user.userId);

    if (isNaN(parseInt(messageId))) {
      res.status(400).json({ error: "Invalid message ID" });
      return;
    }

    if (!content || content.trim().length === 0) {
      res.status(400).json({ error: "Message content is required" });
      return;
    }

    // Verify message exists and user is the sender
    const message = await prisma.message.findFirst({
      where: {
        id: parseInt(messageId),
        senderId: currentUserId,
        isDeleted: false,
      },
    });

    if (!message) {
      res.status(404).json({ error: "Message not found or unauthorized" });
      return;
    }

    const updatedMessage = await prisma.message.update({
      where: { id: parseInt(messageId) },
      data: {
        content: content.trim(),
        isEdited: true,
        editedAt: new Date(),
      },
      include: {
        sender: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    });

    res.json(updatedMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to edit message" });
  }
};

export const deleteMessage = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { messageId } = req.params;
    const currentUserId = parseInt(req.user.userId);

    if (isNaN(parseInt(messageId))) {
      res.status(400).json({ error: "Invalid message ID" });
      return;
    }

    // Verify message exists and user is the sender
    const message = await prisma.message.findFirst({
      where: {
        id: parseInt(messageId),
        senderId: currentUserId,
        isDeleted: false,
      },
    });

    if (!message) {
      res.status(404).json({ error: "Message not found or unauthorized" });
      return;
    }

    await prisma.message.update({
      where: { id: parseInt(messageId) },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        content: "This message was deleted",
      },
    });

    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete message" });
  }
};

export const markMessagesAsRead = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { chatId } = req.params;
    const currentUserId = parseInt(req.user.userId);

    if (isNaN(parseInt(chatId))) {
      res.status(400).json({ error: "Invalid chat ID" });
      return;
    }

    // Verify user is participant of the chat
    const chatParticipant = await prisma.chatParticipant.findFirst({
      where: {
        chatId: parseInt(chatId),
        userId: currentUserId,
        isActive: true,
      },
    });

    if (!chatParticipant) {
      res.status(403).json({ error: "You are not a participant of this chat" });
      return;
    }

    // Get all unread messages in this chat
    const unreadMessages = await prisma.message.findMany({
      where: {
        chatId: parseInt(chatId),
        senderId: { not: currentUserId }, // Don't mark own messages as read
        readStatus: {
          none: {
            userId: currentUserId,
          },
        },
      },
      select: { id: true },
    });

    if (unreadMessages.length > 0) {
      await prisma.messageReadStatus.createMany({
        data: unreadMessages.map((msg) => ({
          messageId: msg.id,
          userId: currentUserId,
        })),
        skipDuplicates: true,
      });
    }

    res.json({
      message: "Messages marked as read",
      markedCount: unreadMessages.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
};

export const getMessageReadStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { messageId } = req.params;
    const currentUserId = parseInt(req.user.userId);

    if (isNaN(parseInt(messageId))) {
      res.status(400).json({ error: "Invalid message ID" });
      return;
    }

    // Verify message exists and user has access
    const message = await prisma.message.findFirst({
      where: {
        id: parseInt(messageId),
        chat: {
          participants: {
            some: {
              userId: currentUserId,
              isActive: true,
            },
          },
        },
      },
    });

    if (!message) {
      res.status(404).json({ error: "Message not found" });
      return;
    }

    const readStatus = await prisma.messageReadStatus.findMany({
      where: {
        messageId: parseInt(messageId),
      },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
      orderBy: { readAt: "asc" },
    });

    res.json(readStatus);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get message read status" });
  }
};
