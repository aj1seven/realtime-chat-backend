const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Message = require("./models/Message");

// Map to track online users: userId -> socketId
const onlineUsers = new Map();

module.exports = (io) => {

  /* ============================
     SOCKET AUTH MIDDLEWARE
  ============================ */
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error("Authentication error"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId; // attach userId to socket
      next();
    } catch (err) {
      return next(new Error("Authentication error"));
    }
  });

  /* ============================
     SOCKET CONNECTION
  ============================ */
  io.on("connection", async (socket) => {
    console.log("🟢 User connected:", socket.userId);

    /* ---- Ensure one active socket per user ---- */
    if (onlineUsers.has(socket.userId)) {
      const oldSocketId = onlineUsers.get(socket.userId);
      io.sockets.sockets.get(oldSocketId)?.disconnect();
    }

    onlineUsers.set(socket.userId, socket.id);

    await User.update(
      { isOnline: true },
      { where: { id: socket.userId } }
    );

    /* ============================
       SEND MESSAGE
    ============================ */
    socket.on("sendMessage", async ({ receiverId, content }) => {
      try {
        const message = await Message.create({
          senderId: socket.userId,
          receiverId,
          content,
        });

        // Reload message to get all fields including timestamps
        const fullMessage = await Message.findByPk(message.id);

        // Send confirmation back to sender
        socket.emit("messageSent", fullMessage);

        // Send to receiver if online
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receiveMessage", fullMessage);
        }
      } catch (err) {
        console.error("❌ Error sending message:", err);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    /* ============================
       READ RECEIPT
    ============================ */
    socket.on("messageRead", async ({ messageId }) => {
      try {
        console.log("📖 Message read event:", messageId);
        console.log("👤 Read by user:", socket.userId);

        // Find the message first to verify ownership
        const message = await Message.findOne({
          where: {
            id: messageId,
            receiverId: socket.userId,
          },
        });

        if (!message) {
          console.log("❌ Message not found or not authorized");
          socket.emit("error", { message: "Message not found or unauthorized" });
          return;
        }

        // Update the message
        await Message.update(
          { isRead: true },
          {
            where: {
              id: messageId,
              receiverId: socket.userId,
            },
          }
        );

        // Fetch the updated message
        const updatedMessage = await Message.findByPk(messageId);

        // Notify the receiver (confirmation)
        socket.emit("messageReadConfirmed", updatedMessage);

        // Notify the sender that their message was read
        const senderSocketId = onlineUsers.get(message.senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit("messageReadByReceiver", updatedMessage);
        }

        console.log("✅ Message marked as read:", messageId);
      } catch (err) {
        console.error("❌ Error marking message as read:", err);
        socket.emit("error", { message: "Failed to mark message as read" });
      }
    });

    /* ============================
       MARK ALL MESSAGES AS READ
    ============================ */
    socket.on("markAllAsRead", async ({ senderId }) => {
      try {
        const [updatedRows] = await Message.update(
          { isRead: true },
          {
            where: {
              receiverId: socket.userId,
              senderId: senderId,
              isRead: false,
            },
          }
        );

        // Notify sender that messages were read
        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId && updatedRows > 0) {
          io.to(senderSocketId).emit("messagesReadByReceiver", {
            receiverId: socket.userId,
            count: updatedRows,
          });
        }

        socket.emit("allMessagesRead", { senderId, count: updatedRows });
        console.log(`✅ Marked ${updatedRows} messages as read`);
      } catch (err) {
        console.error("❌ Error marking all messages as read:", err);
        socket.emit("error", { message: "Failed to mark messages as read" });
      }
    });

    /* ============================
       TYPING INDICATORS
    ============================ */
    socket.on("typing", ({ receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typing", {
          senderId: socket.userId,
        });
      }
    });

    socket.on("stopTyping", ({ receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("stopTyping", {
          senderId: socket.userId,
        });
      }
    });

    /* ============================
       DISCONNECT
    ============================ */
    socket.on("disconnect", async () => {
      console.log("🔴 User disconnected:", socket.userId);

      onlineUsers.delete(socket.userId);

      await User.update(
        {
          isOnline: false,
          lastSeen: new Date(),
        },
        { where: { id: socket.userId } }
      );
    });
  });
};
