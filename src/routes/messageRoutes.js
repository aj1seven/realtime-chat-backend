const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const { authenticate } = require("../middleware/authMiddleware");

// All message routes require authentication
router.use(authenticate);

// Get conversation between current user and another user
router.get("/conversation/:otherUserId", messageController.getConversation);

// Get all conversations for current user
router.get("/conversations", messageController.getConversations);

// Get unread message count
router.get("/unread-count", messageController.getUnreadCount);

// Mark messages as read
router.post("/mark-as-read", messageController.markAsRead);

module.exports = router;

