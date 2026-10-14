// server.ts
import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var isProduction = process.env.NODE_ENV === "production";
var PORT = Number(process.env.PORT) || 3e3;
var DATA_DIR = path.resolve(__dirname, "data");
var SETTINGS_FILE = path.join(DATA_DIR, "settings.json");
var visitorSessions = /* @__PURE__ */ new Map();
var adminTokens = /* @__PURE__ */ new Set();
function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}
function verifyPassword(password, salt, expectedHash) {
  try {
    const derived = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(derived, "hex"), Buffer.from(expectedHash, "hex"));
  } catch {
    return false;
  }
}
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of visitorSessions.entries()) {
    if (now - session.createdAt > 3 * 60 * 60 * 1e3) {
      visitorSessions.delete(id);
    }
  }
}, 10 * 60 * 1e3);
function getDefaultData() {
  const defaultAuth = hashPassword("infinix2026!");
  return {
    settings: {
      websiteTitle: "INFINIX GAMER",
      websiteSubtitle: "Complete the 3 quick steps below to unlock your exclusive VIP gaming files, discord links, and rewards.",
      tiktokUrl: "https://www.tiktok.com/@infinixgamer",
      tiktokButtonText: "Follow on TikTok",
      instagramUrl: "https://www.instagram.com/infinixgamer",
      instagramButtonText: "Follow on Instagram",
      youtubeUrl: "https://www.youtube.com/@infinixgamer",
      youtubeButtonText: "Subscribe on YouTube",
      destinationUrl: "https://discord.gg/infinixgamer",
      unlockButtonText: "UNLOCK YOUR LINK",
      waitingSeconds: 15
    },
    auth: defaultAuth,
    analytics: {
      visits: 0,
      step1Clicks: 0,
      step2Clicks: 0,
      step3Clicks: 0,
      unlocks: 0,
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
    }
  };
}
function readData() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(SETTINGS_FILE)) {
      const initial = getDefaultData();
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
    const content = fs.readFileSync(SETTINGS_FILE, "utf-8");
    const parsed = JSON.parse(content);
    return parsed;
  } catch (err) {
    console.error("Error reading settings file, resetting to defaults:", err);
    return getDefaultData();
  }
}
function saveData(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save settings:", err);
  }
}
function isValidUrl(urlString) {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "Unauthorized: Missing token" });
    return;
  }
  const token = authHeader.substring(7).trim();
  if (!adminTokens.has(token)) {
    res.status(401).json({ success: false, error: "Unauthorized: Invalid or expired token" });
    return;
  }
  next();
}
async function startServer() {
  const app = express();
  app.use(express.json());
  readData();
  app.get("/api/settings", (_req, res) => {
    const data = readData();
    data.analytics.visits += 1;
    data.analytics.lastUpdated = (/* @__PURE__ */ new Date()).toISOString();
    saveData(data);
    const { destinationUrl: _omitted, ...publicSettings } = data.settings;
    res.json({
      success: true,
      settings: publicSettings
    });
  });
  app.post("/api/session/start", (_req, res) => {
    const sessionId = crypto.randomUUID();
    const session = {
      id: sessionId,
      createdAt: Date.now(),
      step1Completed: false,
      step2Completed: false,
      step3Completed: false,
      unlocked: false
    };
    visitorSessions.set(sessionId, session);
    res.json({ success: true, sessionId });
  });
  app.post("/api/session/step-start", (req, res) => {
    const { sessionId, step } = req.body;
    if (!sessionId || !visitorSessions.has(sessionId)) {
      res.status(400).json({ success: false, error: "Invalid or expired session. Please refresh." });
      return;
    }
    const session = visitorSessions.get(sessionId);
    const now = Date.now();
    const data = readData();
    if (step === 1) {
      session.step1StartedAt = now;
      data.analytics.step1Clicks += 1;
    } else if (step === 2) {
      if (!session.step1Completed) {
        res.status(400).json({ success: false, error: "Step 1 must be completed first." });
        return;
      }
      session.step2StartedAt = now;
      data.analytics.step2Clicks += 1;
    } else if (step === 3) {
      if (!session.step2Completed) {
        res.status(400).json({ success: false, error: "Step 2 must be completed first." });
        return;
      }
      session.step3StartedAt = now;
      data.analytics.step3Clicks += 1;
    } else {
      res.status(400).json({ success: false, error: "Invalid step number." });
      return;
    }
    saveData(data);
    res.json({ success: true, stepStartedAt: now });
  });
  app.post("/api/session/step-complete", (req, res) => {
    const { sessionId, step } = req.body;
    if (!sessionId || !visitorSessions.has(sessionId)) {
      res.status(400).json({ success: false, error: "Invalid or expired session. Please refresh." });
      return;
    }
    const session = visitorSessions.get(sessionId);
    const data = readData();
    const requiredMs = (data.settings.waitingSeconds - 1) * 1e3;
    const now = Date.now();
    if (step === 1) {
      if (!session.step1StartedAt) {
        res.status(400).json({ success: false, error: "Step 1 was not started. Please click Follow on TikTok first." });
        return;
      }
      if (now - session.step1StartedAt < requiredMs) {
        const remaining = Math.ceil((requiredMs - (now - session.step1StartedAt)) / 1e3);
        res.status(400).json({ success: false, error: `Waiting period incomplete. Please wait ${remaining} more seconds.` });
        return;
      }
      session.step1Completed = true;
    } else if (step === 2) {
      if (!session.step1Completed) {
        res.status(400).json({ success: false, error: "Step 1 must be completed first." });
        return;
      }
      if (!session.step2StartedAt) {
        res.status(400).json({ success: false, error: "Step 2 was not started. Please click Follow on Instagram first." });
        return;
      }
      if (now - session.step2StartedAt < requiredMs) {
        const remaining = Math.ceil((requiredMs - (now - session.step2StartedAt)) / 1e3);
        res.status(400).json({ success: false, error: `Waiting period incomplete. Please wait ${remaining} more seconds.` });
        return;
      }
      session.step2Completed = true;
    } else if (step === 3) {
      if (!session.step2Completed) {
        res.status(400).json({ success: false, error: "Step 2 must be completed first." });
        return;
      }
      if (!session.step3StartedAt) {
        res.status(400).json({ success: false, error: "Step 3 was not started. Please click Subscribe on YouTube first." });
        return;
      }
      if (now - session.step3StartedAt < requiredMs) {
        const remaining = Math.ceil((requiredMs - (now - session.step3StartedAt)) / 1e3);
        res.status(400).json({ success: false, error: `Waiting period incomplete. Please wait ${remaining} more seconds.` });
        return;
      }
      session.step3Completed = true;
    } else {
      res.status(400).json({ success: false, error: "Invalid step number." });
      return;
    }
    res.json({
      success: true,
      step,
      step1Completed: session.step1Completed,
      step2Completed: session.step2Completed,
      step3Completed: session.step3Completed
    });
  });
  app.post("/api/session/unlock", (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId || !visitorSessions.has(sessionId)) {
      res.status(400).json({ success: false, error: "Invalid or expired session. Please refresh and start from Step 1." });
      return;
    }
    const session = visitorSessions.get(sessionId);
    if (!session.step1Completed || !session.step2Completed || !session.step3Completed) {
      res.status(403).json({
        success: false,
        error: "Step 4 is locked! You must complete Steps 1, 2, and 3 in this session to unlock."
      });
      return;
    }
    const data = readData();
    if (!session.unlocked) {
      session.unlocked = true;
      data.analytics.unlocks += 1;
      saveData(data);
    }
    res.json({
      success: true,
      destinationUrl: data.settings.destinationUrl
    });
  });
  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    if (!password || typeof password !== "string") {
      res.status(400).json({ success: false, error: "Password required" });
      return;
    }
    const data = readData();
    const isValid = verifyPassword(password, data.auth.salt, data.auth.hash);
    if (!isValid) {
      res.status(401).json({ success: false, error: "Incorrect admin password" });
      return;
    }
    const token = crypto.randomBytes(32).toString("hex");
    adminTokens.add(token);
    res.json({ success: true, token });
  });
  app.get("/api/admin/settings", requireAdmin, (_req, res) => {
    const data = readData();
    res.json({
      success: true,
      settings: data.settings,
      analytics: data.analytics
    });
  });
  app.put("/api/admin/settings", requireAdmin, (req, res) => {
    const {
      websiteTitle,
      websiteSubtitle,
      tiktokUrl,
      tiktokButtonText,
      instagramUrl,
      instagramButtonText,
      youtubeUrl,
      youtubeButtonText,
      destinationUrl,
      unlockButtonText,
      waitingSeconds
    } = req.body;
    if (!websiteTitle || typeof websiteTitle !== "string" || websiteTitle.trim().length === 0) {
      res.status(400).json({ success: false, error: "Website title is required." });
      return;
    }
    if (!isValidUrl(tiktokUrl)) {
      res.status(400).json({ success: false, error: "Invalid TikTok URL. Must start with http:// or https://" });
      return;
    }
    if (!isValidUrl(instagramUrl)) {
      res.status(400).json({ success: false, error: "Invalid Instagram URL. Must start with http:// or https://" });
      return;
    }
    if (!isValidUrl(youtubeUrl)) {
      res.status(400).json({ success: false, error: "Invalid YouTube URL. Must start with http:// or https://" });
      return;
    }
    if (!isValidUrl(destinationUrl)) {
      res.status(400).json({ success: false, error: "Invalid Destination URL. Must start with http:// or https://" });
      return;
    }
    const parsedSeconds = Number(waitingSeconds);
    if (isNaN(parsedSeconds) || parsedSeconds < 15 || parsedSeconds > 20) {
      res.status(400).json({ success: false, error: "Waiting time must be between 15 and 20 seconds." });
      return;
    }
    const data = readData();
    data.settings = {
      websiteTitle: websiteTitle.trim(),
      websiteSubtitle: (websiteSubtitle || "").trim(),
      tiktokUrl: tiktokUrl.trim(),
      tiktokButtonText: (tiktokButtonText || "Follow on TikTok").trim(),
      instagramUrl: instagramUrl.trim(),
      instagramButtonText: (instagramButtonText || "Follow on Instagram").trim(),
      youtubeUrl: youtubeUrl.trim(),
      youtubeButtonText: (youtubeButtonText || "Subscribe on YouTube").trim(),
      destinationUrl: destinationUrl.trim(),
      unlockButtonText: (unlockButtonText || "UNLOCK YOUR LINK").trim(),
      waitingSeconds: Math.round(parsedSeconds)
    };
    saveData(data);
    res.json({ success: true, message: "Settings saved successfully", settings: data.settings });
  });
  app.post("/api/admin/change-password", requireAdmin, (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      res.status(400).json({ success: false, error: "New password must be at least 6 characters long." });
      return;
    }
    const data = readData();
    const isValid = verifyPassword(currentPassword, data.auth.salt, data.auth.hash);
    if (!isValid) {
      res.status(401).json({ success: false, error: "Current password is incorrect." });
      return;
    }
    data.auth = hashPassword(newPassword);
    saveData(data);
    res.json({ success: true, message: "Password changed successfully." });
  });
  app.post("/api/admin/reset-stats", requireAdmin, (_req, res) => {
    const data = readData();
    data.analytics = {
      visits: 0,
      step1Clicks: 0,
      step2Clicks: 0,
      step3Clicks: 0,
      unlocks: 0,
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
    };
    saveData(data);
    res.json({ success: true, message: "Analytics stats reset.", analytics: data.analytics });
  });
  app.post("/api/admin/logout", requireAdmin, (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7).trim();
      adminTokens.delete(token);
    }
    res.json({ success: true });
  });
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[INFINIX GAMER] Server active on http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Fatal error starting server:", err);
  process.exit(1);
});
