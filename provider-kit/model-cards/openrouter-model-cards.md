# Luchii-6-Plus
Provider: FrasbergAI
Model Type: Chat / Text Generation
Context Window: 128,000 tokens
Streaming: SSE (Server-Sent Events)
Authentication: Bearer Token
Endpoint: https://api.frasberg.com/v1/chat/completions

## Description
Luchii-6-Plus is FrasbergAI's flagship chat model optimized for reasoning, multi-step tasks, and long-context conversations. Fully compatible with OpenAI-style chat completions.

## Capabilities
- Advanced reasoning
- Long-context memory
- SSE streaming
- Deterministic + creative modes
- Enterprise-grade latency

## Example
```json
{
  "model": "luchii-6-plus",
  "messages": [{"role": "user", "content": "Hello"}],
  "stream": true
}
```

---

# Luchii-6-Mini
Provider: FrasbergAI
Model Type: Chat / Lightweight Text Generation
Context Window: 64,000 tokens
Streaming: SSE
Authentication: Bearer Token
Endpoint: https://api.frasberg.com/v1/chat/completions

## Description
Luchii-6-Mini is a fast, cost-efficient chat model ideal for assistants, agents, and high-volume workloads.

## Capabilities
- Fast inference · Low latency · SSE streaming · Ideal for agents and automation

---

# Luchii-6-Embed
Provider: FrasbergAI
Model Type: Embeddings
Embedding Size: 384 dimensions
Authentication: Bearer Token
Endpoint: https://api.frasberg.com/v1/embeddings

## Description
High-performance embedding model for search, retrieval, ranking, and semantic similarity.

## Capabilities
- 384-dimensional embeddings · Fast vector generation · Enterprise-grade throughput
