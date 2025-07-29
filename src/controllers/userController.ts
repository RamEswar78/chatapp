import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middlewares/AuthMiddleware";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export const getProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.user.userId) },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        avatarUrl: true,
        about: true,
        isVerified: true,
        isOnline: true,
        lastSeen: true,
        notificationsEnabled: true,
        readReceiptsEnabled: true,
        lastSeenVisible: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get user profile" });
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const {
      username,
      phone,
      about,
      avatarUrl,
      notificationsEnabled,
      readReceiptsEnabled,
      lastSeenVisible,
    } = req.body;

    const updateData: any = {};

    if (username !== undefined) {
      if (typeof username !== "string" || username.trim().length === 0) {
        res.status(400).json({ error: "Valid username is required" });
        return;
      }

      // Check if username already exists
      const existingUser = await prisma.user.findUnique({
        where: { username: username.trim() },
        select: { id: true },
      });

      if (existingUser && existingUser.id !== parseInt(req.user.userId)) {
        res.status(409).json({ error: "Username already taken" });
        return;
      }

      updateData.username = username.trim();
    }

    if (phone !== undefined) updateData.phone = phone;
    if (about !== undefined) updateData.about = about;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (notificationsEnabled !== undefined)
      updateData.notificationsEnabled = notificationsEnabled;
    if (readReceiptsEnabled !== undefined)
      updateData.readReceiptsEnabled = readReceiptsEnabled;
    if (lastSeenVisible !== undefined)
      updateData.lastSeenVisible = lastSeenVisible;

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(req.user.userId) },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        avatarUrl: true,
        about: true,
        notificationsEnabled: true,
        readReceiptsEnabled: true,
        lastSeenVisible: true,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

export const searchUsers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { search } = req.query;

    if (!search || typeof search !== "string") {
      res.status(400).json({ error: "Search query is required" });
      return;
    }

    const currentUserId = parseInt(req.user.userId);

    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              {
                username: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                email: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                phone: {
                  contains: search,
                },
              },
            ],
          },
          {
            id: { not: currentUserId }, // Exclude current user
          },
        ],
      },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        avatarUrl: true,
        about: true,
        isOnline: true,
        lastSeen: true,
      },
      take: 20, // Limit results
    });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to search users" });
  }
};

export const getUserStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { userId } = req.params;
    const targetUserId = parseInt(userId);

    if (isNaN(targetUserId)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        about: true,
        isOnline: true,
        lastSeen: true,
        lastSeenVisible: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Check if user allows last seen visibility
    const responseData = {
      ...user,
      lastSeen: user.lastSeenVisible ? user.lastSeen : null,
      lastSeenFormatted:
        user.lastSeenVisible && user.lastSeen
          ? user.lastSeen.toISOString()
          : null,
    };

    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get user status" });
  }
};

export const updateOnlineStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { isOnline } = req.body;

    if (typeof isOnline !== "boolean") {
      res.status(400).json({ error: "Valid online status is required" });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(req.user.userId) },
      data: {
        isOnline,
        lastSeen: new Date(),
      },
      select: { id: true, isOnline: true, lastSeen: true },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update online status" });
  }
};

export const changePassword = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "Current and new passwords are required" });
      return;
    }

    if (newPassword.length < 6) {
      res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.user.userId) },
      select: { passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      res.status(400).json({ error: "No password set for this account" });
      return;
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );
    if (!isCurrentPasswordValid) {
      res.status(400).json({ error: "Current password is incorrect" });
      return;
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: parseInt(req.user.userId) },
      data: { passwordHash: hashedNewPassword },
    });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to change password" });
  }
};
