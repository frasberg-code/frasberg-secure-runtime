// llm/brain.js
import fetch from "node-fetch";

const FRASBERG_BACKEND_URL = process.env.FRASBERG_BACKEND_URL || "http://localhost:8000";
const CANONICAL_ENDPOINT = `${FRASBERG_BACKEND_URL}/api/llm/generate`;

async function _callCanonical(messages) {
  const response = await fetch(CANONICAL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "frasberg-ai", messages })
  });

  if (!response.ok) {
    throw new Error(`Canonical LLM request failed at ${CANONICAL_ENDPOINT}: ${response.statusText}`);
  }

  const result = await response.json();
  return result.output;
}

export async function runLLM(transcript) {
  console.log("Sending transcript to LLM:", transcript);

  try {
    const reply = await _callCanonical([
      { role: "system", content: "You are Frasberg, a warm, human-like conversational AI." },
      { role: "user", content: transcript }
    ]);

    console.log("LLM reply:", reply);
    return reply;
  } catch (err) {
    console.error("LLM error:", err);
    return "Sorry, I had trouble generating a response.";
  }
}

export async function generateSessionSummaryWithTags(events) {
  console.log("Generating session summary with tags...");

  try {
    const reply = await _callCanonical([
      {
        role: "system",
        content: "You are Frasberg, a conversational AI. Summarize the session clearly and warmly, and also provide 2–5 tags that describe the conversation (e.g., greeting, question, farewell, small talk)."
      },
      {
        role: "user",
        content: `Here are the session events:\n${JSON.stringify(events, null, 2)}`
      }
    ]);

    // Expecting output like:
    // "Summary: ...\nTags: tag1, tag2"
    const [summaryLine, tagsLine] = reply.split("\n").map(line => line.trim());

    return {
      summary: summaryLine ? summaryLine.replace(/^Summary:\s*/i, "") : reply,
      tags: tagsLine ? tagsLine.replace(/^Tags:\s*/i, "").split(",").map(t => t.trim()) : []
    };
  } catch (err) {
    console.error("Summary error:", err);
    return { summary: "Summary unavailable due to error.", tags: [] };
  }
}
