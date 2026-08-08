# FrasbergAI Developer Handbook
Version 1.0 — August 2026

## 1. Getting Started
1. Create an account at https://frasberg.com/auth
2. Generate an API key at https://frasberg.com/dashboard (2,500 trial tokens included)
3. Test your first request (see /docs quickstart)
4. Explore the playground

## 2. Authentication
`Authorization: Bearer {FRASBERG_LLM_KEY}` — keys have the `luchii-sk-` prefix.

## 3. Chat Completions
`POST https://api.frasberg.com/v1/chat/completions`
Supports SSE streaming (`stream: true`), system messages, multi-turn conversations.
OpenAI-compatible request/response schema.

## 4. Embeddings
`POST https://api.frasberg.com/v1/embeddings` → 384-dimension vectors (luchii-6-embed).

## 5. Streaming (SSE)
OpenAI-compatible frames:
```
data: {"object": "chat.completion.chunk", "choices": [{"delta": {"content": "..."}}]}
...
data: [DONE]
```

## 6. Rate Limits
60 req/min standard per key. Higher limits by plan or enterprise agreement.

## 7. Error Handling
- 401 — Missing or invalid key
- 402 — Insufficient credits (top up or enable auto top-up)
- 404 — Unknown model
- 413 — Message too long
- 429 — Rate limit exceeded
- 5xx — Internal / upstream error

## 8. Best Practices
- Use streaming for long responses
- Use embeddings for search & retrieval
- Cache frequent requests
- Rotate keys regularly
- Enable auto top-up so production keys never run dry

## 9. SDKs
Any OpenAI-compatible SDK works via `baseURL` override: JavaScript (`openai`, Vercel AI SDK), Python (`openai`, LangChain, LlamaIndex), Go, Rust, Swift.

## 10. Support
support@frasberg.com · status: https://frasberg.com/status
