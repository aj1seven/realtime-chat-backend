const { io } = require("socket.io-client");

const socket = io("http://localhost:4000", {
  auth: {
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc2NzQ1MjYwNCwiZXhwIjoxNzY3NDU2MjA0fQ.jmhV5ryDvFA6s_Ot98YpGgTwe7MAhngqXK4w_zQc7hw"
  }
});

socket.on("connect", () => {
  console.log("✅ User A connected:", socket.id);

  // Send message after connection
  setTimeout(() => {
    socket.emit("sendMessage", {
      receiverId: 2,
      content: "Hello User B 👋 (Testing read receipts)"
    });
    console.log("📤 Message sent");
  }, 2000);
});

socket.on("messageSent", (message) => {
  console.log("✅ Message sent confirmation received:", {
    id: message.id,
    content: message.content,
    isRead: message.isRead
  });
});

socket.on("messageReadByReceiver", (message) => {
  console.log("🎉 Message was read by receiver!", {
    id: message.id,
    isRead: message.isRead
  });
});

socket.on("error", (err) => {
  console.error("❌ Error:", err);
});
