require("dotenv").config();

const express = require("express");
const cors = require("cors");
const sequelize = require("./config/database");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use("/api/auth", authRoutes);

app.use(cors());

sequelize.sync()
  .then(() => console.log("✅ Database synced"))
  .catch(err => console.error("❌ DB error:", err));

module.exports = app;


