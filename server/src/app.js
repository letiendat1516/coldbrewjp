require("dotenv").config();

// BigInt JSON serialization fix
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes");
const classRoutes = require("./routes/class.routes");
const stickerRoutes = require("./routes/sticker.routes");
const rewardRoutes = require("./routes/reward.routes");
const rankingRoutes = require("./routes/ranking.routes");
const announcementRoutes = require("./routes/announcement.routes");

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/stickers", stickerRoutes);
app.use("/api/rewards", rewardRoutes);
app.use("/api/ranking", rankingRoutes);
app.use("/api/announcements", announcementRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;
