const Message = require("../models/Message");
const User = require("../models/User");
const { Op } = require("sequelize");

// Get conversation between two users
exports.getConversation = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.userId;

    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      order: [["createdAt", "ASC"]],
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "username", "email"],
        },
        {
          model: User,
          as: "receiver",
          attributes: ["id", "username", "email"],
        },
      ],
    });

    res.json(messages);
  } catch (err) {
    console.error("❌ Error fetching conversation:", err);
    res.status(500).json({ message: "Failed to fetch conversation" });
  }
};

// Get all conversations for a user
exports.getConversations = async (req, res) => {
  try {
    const userId = req.userId;

    // Get all unique conversation partners
    const sentMessages = await Message.findAll({
      where: { senderId: userId },
      attributes: ["receiverId"],
      group: ["receiverId"],
    });

    const receivedMessages = await Message.findAll({
      where: { receiverId: userId },
      attributes: ["senderId"],
      group: ["senderId"],
    });

    const partnerIds = new Set();
    sentMessages.forEach((msg) => partnerIds.add(msg.receiverId));
    receivedMessages.forEach((msg) => partnerIds.add(msg.senderId));

    // Get last message for each conversation
    const conversations = await Promise.all(
      Array.from(partnerIds).map(async (partnerId) => {
        const lastMessage = await Message.findOne({
          where: {
            [Op.or]: [
              { senderId: userId, receiverId: partnerId },
              { senderId: partnerId, receiverId: userId },
            ],
          },
          order: [["createdAt", "DESC"]],
          include: [
            {
              model: User,
              as: "sender",
              attributes: ["id", "username", "email"],
            },
            {
              model: User,
              as: "receiver",
              attributes: ["id", "username", "email"],
            },
          ],
        });

        const unreadCount = await Message.count({
          where: {
            senderId: partnerId,
            receiverId: userId,
            isRead: false,
          },
        });

        const partner = await User.findByPk(partnerId, {
          attributes: ["id", "username", "email", "isOnline", "lastSeen"],
        });

        return {
          partner,
          lastMessage,
          unreadCount,
        };
      })
    );

    res.json(conversations);
  } catch (err) {
    console.error("❌ Error fetching conversations:", err);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.userId;

    const count = await Message.count({
      where: {
        receiverId: userId,
        isRead: false,
      },
    });

    res.json({ unreadCount: count });
  } catch (err) {
    console.error("❌ Error fetching unread count:", err);
    res.status(500).json({ message: "Failed to fetch unread count" });
  }
};

// Mark messages as read (REST endpoint)
exports.markAsRead = async (req, res) => {
  try {
    const { messageIds, senderId } = req.body;
    const userId = req.userId;

    if (messageIds && Array.isArray(messageIds)) {
      // Mark specific messages as read
      await Message.update(
        { isRead: true },
        {
          where: {
            id: { [Op.in]: messageIds },
            receiverId: userId,
          },
        }
      );
    } else if (senderId) {
      // Mark all messages from a sender as read
      await Message.update(
        { isRead: true },
        {
          where: {
            senderId: senderId,
            receiverId: userId,
            isRead: false,
          },
        }
      );
    } else {
      return res.status(400).json({ message: "messageIds or senderId required" });
    }

    res.json({ message: "Messages marked as read" });
  } catch (err) {
    console.error("❌ Error marking messages as read:", err);
    res.status(500).json({ message: "Failed to mark messages as read" });
  }
};


