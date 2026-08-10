// tts/elevenlabs-tts.js
import fetch from "node-fetch";

const ELEVEN_TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech";

// This function takes text and returns audio chunks
export function startTTSStream(text) {
  console.log("Starting ElevenLabs TTS for reply:", text);

  const listeners = {};

  function on(event, cb) {
    listeners[event] = cb;
  }

  (async () => {
    try {
      const response = await fetch(`${ELEVEN_TTS_URL}/frasberg`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.ELEVENLABS_TTS_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text,
          voice_settings: {
            stability: 0.7,
            similarity_boost: 0.9
          }
        })
      });

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.statusText}`);
      }

      const audioBuffer = await response.arrayBuffer();

      // Emit audio back to the pipeline
      if (listeners["audio"]) {
        listeners["audio"](Buffer.from(audioBuffer));
      }
    } catch (err) {
      console.error("TTS error:", err);
      if (listeners["error"]) {
        listeners["error"](err.message);
      }
    }
  })();

  return { on };
}

