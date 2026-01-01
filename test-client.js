const { io } = require("socket.io-client");

const socket = io("http://localhost:4000");

socket.on("connect", () => {
  console.log("✅ Connected with socket ID:", socket.id);
});

socket.on("disconnect", () => {
  console.log("❌ Disconnected");
});
