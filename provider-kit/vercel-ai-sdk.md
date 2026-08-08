# Vercel AI SDK — Provider Announcement — FrasbergAI

**Send to:** Vercel AI SDK community providers (https://github.com/vercel/ai — community provider PR) 
**Subject:** New Provider Announcement — FrasbergAI for Vercel AI SDK

Hello Vercel team,

FrasbergAI is now a fully verified LLM provider and ready for inclusion in the Vercel AI SDK provider ecosystem.

**Provider Details:**
- Provider ID: `frasbergai`
- Base URL: `https://api.frasberg.com/v1`
- Auth: Bearer
- Models: luchii-6-plus · luchii-6-mini · luchii-6-embed
- Streaming: SSE
- Compatibility: Fully OpenAI-compatible request/response schema

**Works today via the OpenAI-compatible provider:**
```ts
import { createOpenAI } from "@ai-sdk/openai";

const frasberg = createOpenAI({
  baseURL: "https://api.frasberg.com/v1",
  apiKey: process.env.FRASBERG_LLM_KEY,
});

const { textStream } = await streamText({
  model: frasberg("luchii-6-plus"),
  prompt: "Hello",
});
```

FrasbergAI is ready for provider listing and documentation inclusion.

Best,
FrasbergAI Platform Team — FRASBERG INC
