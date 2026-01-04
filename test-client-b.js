const { io } = require("socket.io-client");

console.log("🚀 Starting User B client...");

const socket = io("http://localhost:4000", {
  auth: {
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc2NzQ1MjYzNiwiZXhwIjoxNzY3NDU2MjM2fQ.WXawSV4X3Zp-Ggr7T8KLSGo5ztUi2Mt7jbdVllYtkpU"
  }
});

socket.on("connect", () => {
  console.log("✅ User B connected:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("❌ Connection error:", err.message);
});

socket.on("receiveMessage", (msg) => {
  console.log("📩 User B received message:", {
    id: msg.id,
    content: msg.content,
    isRead: msg.isRead,
    senderId: msg.senderId
  });

  // Mark message as read after receiving
  setTimeout(() => {
    console.log("📖 Marking message as read...");
    socket.emit("messageRead", { messageId: msg.id });
  }, 1000);
});

socket.on("messageReadConfirmed", (message) => {
  console.log("✅ Message read confirmation:", {
    id: message.id,
    isRead: message.isRead
  });
});

socket.on("error", (err) => {
  console.error("❌ Error:", err);
});

socket.on("disconnect", () => {
  console.log("🔴 User B disconnected");
});
