import { Request, Response } from "express";
import { PrismaClient, ChatType, ParticipantRole } from "@prisma/client";
import { AuthRequest } from "../middlewares/AuthMiddleware";

const prisma = new PrismaClient();

export const createChat = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const currentUserId = parseInt(req.user.userId);
    const { participantId, chatType, name, description } = req.body;

    if (chatType === "direct") {
      if (!participantId) {
        res
          .status(400)
          .json({ error: "Participant ID is required for direct chat" });
        return;
      }

      const participantIdInt = parseInt(participantId);
      if (isNaN(participantIdInt)) {
        res.status(400).json({ error: "Invalid participant ID" });
        return;
      }

      // Check if participant exists
      const participant = await prisma.user.findUnique({
        where: { id: participantIdInt },
      });

      if (!participant) {
        res.status(404).json({ error: "Participant not found" });
        return;
      }

      // Check if direct chat already exists
      const existingChat = await prisma.chat.findFirst({
        where: {
          chatType: "direct",
          participants: {
            every: {
              userId: { in: [currentUserId, participantIdInt] },
            },
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: { id: true, username: true, avatarUrl: true },
              },
            },
          },
        },
      });

      if (existingChat) {
        res.json(existingChat);
        return;
      }
    }

    // Create new chat
    const newChat = await prisma.chat.create({
      data: {
        chatType: chatType as ChatType,
        name: chatType === "group" ? name : null,
        description: chatType === "group" ? description : null,
        createdBy: currentUserId,
        participants: {
          create: [
            {
              userId: currentUserId,
              role: "admin",
            },
            ...(chatType === "direct"
              ? [
                  {
                    userId: parseInt(participantId),
                    role: "member" as ParticipantRole,
                  },
                ]
              : []),
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, username: true, avatarUrl: true },
            },
          },
        },
      },
    });

    res.status(201).json(newChat);
  } catch (error) {
    console.error("Error creating chat:", error);
    res.status(500).json({ error: "Failed to create chat" });
  }
};

export const getUserChats = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const currentUserId = parseInt(req.user.userId);

    const chats = await prisma.chat.findMany({
      where: {
        participants: {
          some: {
            userId: currentUserId,
            isActive: true,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, username: true, avatarUrl: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: {
              select: { id: true, username: true },
            },
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                readStatus: {
                  none: {
                    userId: currentUserId,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Format response with last message and unread count
    const formattedChats = chats.map((chat) => ({
      ...chat,
      lastMessage: chat.messages[0] || null,
      unreadCount: chat._count.messages,
      messages: undefined,
      _count: undefined,
    }));

    res.json(formattedChats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ error: "Failed to fetch chats" });
  }
};

export const getChatDetails = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const currentUserId = parseInt(req.user.userId);
    const chatId = parseInt(req.params.chatId);

    if (isNaN(chatId)) {
      res.status(400).json({ error: "Invalid chat ID" });
      return;
    }

    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        participants: {
          some: {
            userId: currentUserId,
            isActive: true,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                avatarUrl: true,
                isOnline: true,
                lastSeen: true,
              },
            },
          },
        },
      },
    });

    if (!chat) {
      res.status(404).json({ error: "Chat not found or unauthorized" });
      return;
    }

    res.json(chat);
  } catch (error) {
    console.error("Error fetching chat details:", error);
    res.status(500).json({ error: "Failed to fetch chat details" });
  }
};

export const addParticipant = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const currentUserId = parseInt(req.user.userId);
    const chatId = parseInt(req.params.chatId);
    const { userId } = req.body;

    if (isNaN(chatId) || isNaN(parseInt(userId))) {
      res.status(400).json({ error: "Invalid chat ID or user ID" });
      return;
    }

    const participantUserId = parseInt(userId);

    // Check if current user is admin of the chat
    const currentUserParticipant = await prisma.chatParticipant.findFirst({
      where: {
        chatId,
        userId: currentUserId,
        role: "admin",
        isActive: true,
      },
    });

    if (!currentUserParticipant) {
      res.status(403).json({ error: "Only admins can add participants" });
      return;
    }

    // Check if user exists
    const userToAdd = await prisma.user.findUnique({
      where: { id: participantUserId },
    });

    if (!userToAdd) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Check if user is already a participant
    const existingParticipant = await prisma.chatParticipant.findFirst({
      where: {
        chatId,
        userId: participantUserId,
      },
    });

    if (existingParticipant) {
      if (existingParticipant.isActive) {
        res.status(400).json({ error: "User is already a participant" });
        return;
      } else {
        // Reactivate participant
        await prisma.chatParticipant.update({
          where: { id: existingParticipant.id },
          data: {
            isActive: true,
            joinedAt: new Date(),
            leftAt: null,
          },
        });
      }
    } else {
      // Add new participant
      await prisma.chatParticipant.create({
        data: {
          chatId,
          userId: participantUserId,
          role: "member",
        },
      });
    }

    // Get updated chat with participants
    const updatedChat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, username: true, avatarUrl: true },
            },
          },
        },
      },
    });

    res.json(updatedChat);
  } catch (error) {
    console.error("Error adding participant:", error);
    res.status(500).json({ error: "Failed to add participant" });
  }
};

export const removeParticipant = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const currentUserId = parseInt(req.user.userId);
    const chatId = parseInt(req.params.chatId);
    const userIdToRemove = parseInt(req.params.userId);

    if (isNaN(chatId) || isNaN(userIdToRemove)) {
      res.status(400).json({ error: "Invalid chat ID or user ID" });
      return;
    }

    // Check if current user is admin or removing themselves
    const currentUserParticipant = await prisma.chatParticipant.findFirst({
      where: {
        chatId,
        userId: currentUserId,
        isActive: true,
      },
    });

    if (!currentUserParticipant) {
      res.status(403).json({ error: "Unauthorized" });
      return;
    }

    if (
      currentUserParticipant.role !== "admin" &&
      currentUserId !== userIdToRemove
    ) {
      res
        .status(403)
        .json({ error: "Only admins can remove other participants" });
      return;
    }

    // Remove participant
    await prisma.chatParticipant.updateMany({
      where: {
        chatId,
        userId: userIdToRemove,
      },
      data: {
        isActive: false,
        leftAt: new Date(),
      },
    });

    // Get updated chat with participants
    const updatedChat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        participants: {
          where: { isActive: true },
          include: {
            user: {
              select: { id: true, username: true, avatarUrl: true },
            },
          },
        },
      },
    });

    res.json(updatedChat);
  } catch (error) {
    console.error("Error removing participant:", error);
    res.status(500).json({ error: "Failed to remove participant" });
  }
};

export const updateChatInfo = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const currentUserId = parseInt(req.user.userId);
    const chatId = parseInt(req.params.chatId);
    const { name, description, avatarUrl } = req.body;

    if (isNaN(chatId)) {
      res.status(400).json({ error: "Invalid chat ID" });
      return;
    }

    // Check if current user is admin of the chat
    const currentUserParticipant = await prisma.chatParticipant.findFirst({
      where: {
        chatId,
        userId: currentUserId,
        role: "admin",
        isActive: true,
      },
    });

    if (!currentUserParticipant) {
      res.status(403).json({ error: "Only admins can update chat info" });
      return;
    }

    // Update chat info
    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(avatarUrl && { avatarUrl }),
      },
      include: {
        participants: {
          where: { isActive: true },
          include: {
            user: {
              select: { id: true, username: true, avatarUrl: true },
            },
          },
        },
      },
    });

    res.json(updatedChat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update chat info" });
  }
};
