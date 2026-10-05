// stt/elevenlabs-stt.js
import fetch from "node-fetch";
import { Readable } from "stream";

const ELEVEN_STT_URL = "https://api.elevenlabs.io/v1/speech-to-text";

// This function takes an audio stream (WebRTC track) and pipes it to ElevenLabs STT
export function startSTTStream(audioStream) {
  console.log("Starting ElevenLabs STT stream...");

  const listeners = {};

  function on(event, cb) {
    listeners[event] = cb;
  }

  // Convert WebRTC audio track into a Node.js readable stream
  const audioReadable = new Readable({
    read() {}
  });

  audioStream.on("data", (chunk) => {
    audioReadable.push(chunk);
  });

  audioStream.on("end", () => {
    audioReadable.push(null);
  });

  // Send audio to ElevenLabs STT
  (async () => {
    try {
      const response = await fetch(ELEVEN_STT_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.ELEVENLABS_STT_KEY}`,
          "Content-Type": "audio/wav"
        },
        body: audioReadable
      });

      if (!response.ok) {
        throw new Error(`STT request failed: ${response.statusText}`);
      }

      const result = await response.json();

      // ElevenLabs returns transcript text
      if (listeners["transcript"]) {
        listeners["transcript"](result.text);
      }
    } catch (err) {
      console.error("STT error:", err);
      if (listeners["error"]) {
        listeners["error"](err.message);
      }
    }
  })();

  return { on };
}
