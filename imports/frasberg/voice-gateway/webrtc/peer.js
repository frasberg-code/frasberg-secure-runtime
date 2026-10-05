// webrtc/peer.js

import wrtc from "wrtc";
import { startSTTStream } from "../stt/elevenlabs-stt.js";
import { runLLM } from "../llm/brain.js";
import { startTTSStream } from "../tts/elevenlabs-tts.js";
import { logEvent } from "../logs/supabase-logger.js";

export async function createPeer(ws, sessionId) {
  console.log("Creating WebRTC peer for session:", sessionId);

  const peer = new wrtc.RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  peer.ontrack = (event) => {
    console.log("Received audio track from browser");

    const audioStream = event.streams[0];
    const stt = startSTTStream(audioStream);

    stt.on("transcript", async (text) => {
      console.log("Transcript:", text);

      // Log transcript
      try { await logEvent(sessionId, "transcript", { text }); } catch (e) { console.error(e); }

      const reply = await runLLM(text);

      // Log reply
      try { await logEvent(sessionId, "llm-reply", { text: reply }); } catch (e) { console.error(e); }

      // Send reply text back
      ws.send(JSON.stringify({ type: "llm-reply", text: reply }));

      // Generate TTS audio
      const tts = startTTSStream(reply);

      tts.on("audio", async (chunk) => {
        ws.send(JSON.stringify({ type: "tts-audio", audio: chunk.toString("base64") }));

        // Log audio chunk
        try { await logEvent(sessionId, "tts-audio", { size: chunk.length }); } catch (e) { console.error(e); }
      });
    });
  };

  peer.onicecandidate = (event) => {
    if (event.candidate) {
      ws.send(JSON.stringify({ type: "ice-candidate", candidate: event.candidate }));
    }
  };

  return peer;
}
