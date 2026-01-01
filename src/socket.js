const jwt = require("jsonwebtoken");
const User = require("./models/User");

module.exports = (io) => {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication error"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", async (socket) => {
    console.log("🟢 User connected:", socket.userId);

    await User.update(
      { isOnline: true },
      { where: { id: socket.userId } }
    );

    socket.on("disconnect", async () => {
      console.log("🔴 User disconnected:", socket.userId);
      await User.update(
        { isOnline: false },
        { where: { id: socket.userId } }
      );
    });
  });
};
