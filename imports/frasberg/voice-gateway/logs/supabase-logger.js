// logs/supabase-logger.js
import fetch from "node-fetch";

export async function logEvent(sessionId, eventType, data) {
  try {
    const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/log-event`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.SUPABASE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        session_id: sessionId,
        event_type: eventType,
        data
      })
    });

    if (!response.ok) {
      throw new Error(`Supabase log failed: ${response.statusText}`);
    }

    console.log(`Logged event: ${eventType}`);
  } catch (err) {
    console.error("Logging error:", err);
  }
}

