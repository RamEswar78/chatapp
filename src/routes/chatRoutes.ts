import express from "express";
import { authMiddleware } from "../middlewares/AuthMiddleware";
import {
  createChat,
  getUserChats,
  getChatDetails,
  addParticipant,
  removeParticipant,
  updateChatInfo,
} from "../controllers/chatController";
import {
  getChatMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  markMessagesAsRead,
  getMessageReadStatus,
} from "../controllers/messageController";

const router = express.Router();

// Chat management routes
router.post("/", authMiddleware, createChat);
router.get("/", authMiddleware, getUserChats);
router.get("/:chatId", authMiddleware, getChatDetails);
router.put("/:chatId", authMiddleware, updateChatInfo);

// Participant management
router.post("/:chatId/participants", authMiddleware, addParticipant);
router.delete(
  "/:chatId/participants/:participantId",
  authMiddleware,
  removeParticipant
);

// Message routes
router.get("/:chatId/messages", authMiddleware, getChatMessages);
router.post("/:chatId/messages", authMiddleware, sendMessage);
router.put("/:chatId/messages/read", authMiddleware, markMessagesAsRead);

// Individual message operations
router.put("/messages/:messageId", authMiddleware, editMessage);
router.delete("/messages/:messageId", authMiddleware, deleteMessage);
router.get(
  "/messages/:messageId/read-status",
  authMiddleware,
  getMessageReadStatus
);

export default router;
