import express from "express";
import { WebSocketServer } from "ws";
import http from "http";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import {
  createSession, getSession, updateSession, destroySession, getSessionCount
} from "./sessionManager.js";
import { launchGame, getAllGames } from "./gameManager.js";
import { createPeerConnection, handleOffer, addIceCandidate } from "./webrtcHandler.js";
import { handleKeyEvent, handleMouseMove, handleMouseClick } from "./inputHandler.js";

dotenv.config();

const app = express();
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/stream" });

const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 4000;

// ─── REST: List Games ──────────────────────────────────────
app.get("/games", (req, res) => {
  res.json(getAllGames());
});

// ─── REST: Server Health ───────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    sessions: getSessionCount(),
    uptime: process.uptime(),
  });
});

// ─── WebSocket: Streaming Session ─────────────────────────
wss.on("connection", async (ws, req) => {
  // Auth via token query param
  const url = new URL(req.url, "http://localhost");
  const token = url.searchParams.get("token");
  const gameId = url.searchParams.get("game") || "dungeon3d";

  let userId;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    userId = decoded.sub;
  } catch (e) {
    ws.send(JSON.stringify({ type: "error", message: "Unauthorized" }));
    ws.close();
    return;
  }

  // Create session
  const session = createSession(userId, gameId);
  const displayId = 99 + (getSessionCount() % 50); // Virtual display pool

  ws.send(JSON.stringify({ type: "session_created", sessionId: session.id }));

  try {
    // Launch game process
    const gameProcess = await launchGame(gameId, displayId);
    updateSession(session.id, { gameProcess, status: "running" });

    // Create WebRTC peer connection
    const { pc, captureProcess } = await createPeerConnection(session.id, displayId);
    updateSession(session.id, { peerConnection: pc, captureProcess });

    ws.send(JSON.stringify({ type: "ready", sessionId: session.id }));

    // ─── Handle Messages ──────────────────────────────────
    ws.on("message", async (raw) => {
      let msg;
      try { msg = JSON.parse(raw); } catch { return; }

      switch (msg.type) {

        case "offer":
          try {
            const answerSdp = await handleOffer(pc, msg.sdp);
            ws.send(JSON.stringify({ type: "answer", sdp: answerSdp }));
          } catch (e) {
            ws.send(JSON.stringify({ type: "error", message: e.message }));
          }
          break;

        case "ice_candidate":
          try {
            await addIceCandidate(pc, msg.candidate);
          } catch (_) {}
          break;

        case "keydown":
        case "keyup":
          await handleKeyEvent(displayId, msg.key, msg.type);
          break;

        case "mousemove":
          await handleMouseMove(displayId, msg.x, msg.y);
          break;

        case "mousedown":
        case "mouseup":
          await handleMouseClick(displayId, msg.button, msg.type);
          break;

        case "ping":
          ws.send(JSON.stringify({ type: "pong", ts: Date.now() }));
          break;
      }
    });

    ws.on("close", () => {
      destroySession(session.id);
    });

  } catch (e) {
    console.error("Session error:", e);
    ws.send(JSON.stringify({ type: "error", message: e.message }));
    destroySession(session.id);
    ws.close();
  }
});

server.listen(PORT, () => {
  console.log(`🎮 Luchii Streaming Server running on port ${PORT}`);
});
