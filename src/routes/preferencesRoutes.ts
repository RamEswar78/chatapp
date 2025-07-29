import express from "express";
import { authMiddleware } from "../middlewares/AuthMiddleware";
import {
  getUserPreferences,
  updateUserPreferences,
  addContact,
  getUserContacts,
  updateContact,
  removeContact,
  getBlockedContacts,
} from "../controllers/preferencesController";

const router = express.Router();

// User preferences
router.get("/", authMiddleware, getUserPreferences);
router.put("/", authMiddleware, updateUserPreferences);

// Contacts management
router.post("/contacts", authMiddleware, addContact);
router.get("/contacts", authMiddleware, getUserContacts);
router.get("/contacts/blocked", authMiddleware, getBlockedContacts);
router.put("/contacts/:contactId", authMiddleware, updateContact);
router.delete("/contacts/:contactId", authMiddleware, removeContact);

export default router;
