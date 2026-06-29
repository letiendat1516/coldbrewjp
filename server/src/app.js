require("dotenv").config();
BigInt.prototype.toJSON = function () { return this.toString(); };

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
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/stickers", stickerRoutes);
app.use("/api/rewards", rewardRoutes);
app.use("/api/ranking", rankingRoutes);
app.use("/api/announcements", announcementRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Mazii dictionary proxy
app.post("/api/mazii/search", async (req, res) => {
  try {
    const { keyword } = req.body;
    if (!keyword) return res.status(400).json({ success: false, message: "Keyword required" });
    const r = await fetch("https://mazii.net/api/search/word", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer a1dff8abeb4b03cc4ff96378ef8e01eb", "User-Agent": "Mozilla/5.0", "Referer": "https://mazii.net/", "Origin": "https://mazii.net" },
      body: JSON.stringify({ dict: "javi", type: "word", query: keyword, limit: 15, page: 1 }),
    });
    const data = await r.json();
    res.json({ success: true, data: data.data || data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Google Translate proxy
app.post("/api/translate", async (req, res) => {
  try {
    const { text, sourceLang, targetLang } = req.body;
    if (!text) return res.status(400).json({ success: false, message: "Text required" });
    const url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" + (sourceLang || "ja") + "&tl=" + (targetLang || "vi") + "&dt=t&q=" + encodeURIComponent(text);
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const data = await r.json();
    const translated = (data[0] || []).map(t => t[0]).join("");
    res.json({ success: true, data: { translatedText: translated, originalText: text } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || "Internal Server Error" });
});

module.exports = app;

// Handwriting proxy
app.post("/api/handwriting", async (req, res) => {
  try {
    const r = await fetch("https://inputtools.google.com/request?itc=ja-t-i0-handwrit&app=translate", {
      method: "POST", headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0", "Origin": "https://mazii.net" },
      body: JSON.stringify(req.body)
    });
    const text = await r.text();
    const json = JSON.parse(text.slice(4)); // Google prepends ")]}'" plus newline
    const candidates = (json[1] || [])[0] || [];
    res.json({ success: true, data: candidates });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
