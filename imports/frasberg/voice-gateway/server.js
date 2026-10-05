import http from "http";
import { WebSocketServer } from "ws";
import dotenv from "dotenv";
import { handleSignal } from "./signaling/handleSignal.js";
import { createPeer } from "./webrtc/peer.js";
import { logEvent } from "./logs/supabase-logger.js";
import { generateSessionSummaryWithTags } from "./llm/brain.js";
import { randomUUID } from "crypto";

dotenv.config();

const server = http.createServer();
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("Client connected to Voice Gateway");

  // Generate a sessionId for this connection
  const sessionId = randomUUID();
  ws.sessionId = sessionId;

  // Log session start
  logEvent(sessionId, "session-start", { message: "Conversation started" }).catch(err => console.error(err));

  ws.on("message", async (msg) => {
    const data = JSON.parse(msg);

    if (data.type === "signal") {
      const response = await handleSignal(data);
      ws.send(JSON.stringify(response));
    }

    if (data.type === "start-webrtc") {
      const peer = await createPeer(ws, sessionId);
      ws.peer = peer;
    }
  });

  ws.on("close", async () => {
    console.log("Client disconnected");

    try {
      // In production collect real events; here we pass a small placeholder
      const events = [
        { type: "session-start", message: "Conversation started" },
        { type: "session-end", message: "Conversation ended" }
      ];

      const { summary, tags } = await generateSessionSummaryWithTags(events);

      // Log session end and summary/tags
      await logEvent(sessionId, "session-end", { message: "Conversation ended" });
      await logEvent(sessionId, "session-summary", { text: summary });
      await logEvent(sessionId, "session-tags", { tags });
    } catch (err) {
      console.error("Error during session close tasks:", err);
      await logEvent(sessionId, "session-end", { message: "Conversation ended (error during summary)" }).catch(() => {});
    }
  });
});

server.listen(8080, () => {
  console.log("Voice Gateway running on port 8080");
});

