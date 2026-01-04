require("dotenv").config();
require("./models"); // register all models

const express = require("express");
const cors = require("cors");
const sequelize = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const messageRoutes = require("./routes/messageRoutes");

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// health check
app.get("/", (req, res) => {
  res.send("Realtime Chat Backend running 🚀");
});

// sync DB
sequelize.sync({ alter: true })
  .then(() => console.log("✅ Database synced (altered)"))
  .catch(err => console.error("❌ DB error:", err));


module.exports = app;
