import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middlewares/AuthMiddleware";

const prisma = new PrismaClient();

export const getUserPreferences = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const currentUserId = parseInt(req.user.userId);

    let preferences = await prisma.userPreferences.findUnique({
      where: { userId: currentUserId },
    });

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await prisma.userPreferences.create({
        data: { userId: currentUserId },
      });
    }

    res.json(preferences);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get user preferences" });
  }
};

export const updateUserPreferences = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const currentUserId = parseInt(req.user.userId);
    const {
      theme,
      language,
      fontSize,
      notificationSound,
      chatWallpaper,
      autoDownloadMedia,
      backupFrequency,
      preferencesJson,
    } = req.body;

    const updateData: any = {};
    if (theme !== undefined) updateData.theme = theme;
    if (language !== undefined) updateData.language = language;
    if (fontSize !== undefined) updateData.fontSize = fontSize;
    if (notificationSound !== undefined)
      updateData.notificationSound = notificationSound;
    if (chatWallpaper !== undefined) updateData.chatWallpaper = chatWallpaper;
    if (autoDownloadMedia !== undefined)
      updateData.autoDownloadMedia = autoDownloadMedia;
    if (backupFrequency !== undefined)
      updateData.backupFrequency = backupFrequency;
    if (preferencesJson !== undefined)
      updateData.preferencesJson = preferencesJson;

    const preferences = await prisma.userPreferences.upsert({
      where: { userId: currentUserId },
      update: updateData,
      create: { userId: currentUserId, ...updateData },
    });

    res.json(preferences);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update user preferences" });
  }
};

export const addContact = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { contactUserId, contactName } = req.body;
    const currentUserId = parseInt(req.user.userId);

    if (!contactUserId) {
      res.status(400).json({ error: "Contact user ID is required" });
      return;
    }

    const contactUserIdInt = parseInt(contactUserId);
    if (isNaN(contactUserIdInt) || contactUserIdInt === currentUserId) {
      res.status(400).json({ error: "Invalid contact user ID" });
      return;
    }

    // Check if contact user exists
    const contactUser = await prisma.user.findUnique({
      where: { id: contactUserIdInt },
    });

    if (!contactUser) {
      res.status(404).json({ error: "Contact user not found" });
      return;
    }

    // Check if contact already exists
    const existingContact = await prisma.userContact.findUnique({
      where: {
        userId_contactUserId: {
          userId: currentUserId,
          contactUserId: contactUserIdInt,
        },
      },
    });

    if (existingContact) {
      res.status(400).json({ error: "Contact already exists" });
      return;
    }

    const contact = await prisma.userContact.create({
      data: {
        userId: currentUserId,
        contactUserId: contactUserIdInt,
        contactName,
      },
      include: {
        contactUser: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
            about: true,
            isOnline: true,
            lastSeen: true,
          },
        },
      },
    });

    res.status(201).json(contact);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add contact" });
  }
};

export const getUserContacts = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const currentUserId = parseInt(req.user.userId);

    const contacts = await prisma.userContact.findMany({
      where: {
        userId: currentUserId,
        isBlocked: false,
      },
      include: {
        contactUser: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
            about: true,
            isOnline: true,
            lastSeen: true,
          },
        },
      },
      orderBy: { addedAt: "desc" },
    });

    res.json(contacts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get user contacts" });
  }
};

export const updateContact = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { contactId } = req.params;
    const { contactName, isBlocked, isFavorite } = req.body;
    const currentUserId = parseInt(req.user.userId);

    if (isNaN(parseInt(contactId))) {
      res.status(400).json({ error: "Invalid contact ID" });
      return;
    }

    const updateData: any = {};
    if (contactName !== undefined) updateData.contactName = contactName;
    if (isBlocked !== undefined) updateData.isBlocked = isBlocked;
    if (isFavorite !== undefined) updateData.isFavorite = isFavorite;

    const contact = await prisma.userContact.update({
      where: {
        id: parseInt(contactId),
        userId: currentUserId,
      },
      data: updateData,
      include: {
        contactUser: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
            about: true,
            isOnline: true,
            lastSeen: true,
          },
        },
      },
    });

    res.json(contact);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update contact" });
  }
};

export const removeContact = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { contactId } = req.params;
    const currentUserId = parseInt(req.user.userId);

    if (isNaN(parseInt(contactId))) {
      res.status(400).json({ error: "Invalid contact ID" });
      return;
    }

    await prisma.userContact.delete({
      where: {
        id: parseInt(contactId),
        userId: currentUserId,
      },
    });

    res.json({ message: "Contact removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to remove contact" });
  }
};

export const getBlockedContacts = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const currentUserId = parseInt(req.user.userId);

    const blockedContacts = await prisma.userContact.findMany({
      where: {
        userId: currentUserId,
        isBlocked: true,
      },
      include: {
        contactUser: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.json(blockedContacts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get blocked contacts" });
  }
};
