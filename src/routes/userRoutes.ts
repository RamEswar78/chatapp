import express from "express";
import { authMiddleware } from "../middlewares/AuthMiddleware";
import {
  getProfile,
  updateProfile,
  searchUsers,
  getUserStatus,
  updateOnlineStatus,
  changePassword,
} from "../controllers/userController";

const router = express.Router();

// Get user profile
router.get("/profile", authMiddleware, getProfile);

// Update user profile
router.put("/profile", authMiddleware, updateProfile);

// Search users
router.get("/search", authMiddleware, searchUsers);

// Get user status
router.get("/status/:userId", authMiddleware, getUserStatus);

// Update online status
router.put("/online-status", authMiddleware, updateOnlineStatus);

// Change password
router.put("/change-password", authMiddleware, changePassword);

export default router;
