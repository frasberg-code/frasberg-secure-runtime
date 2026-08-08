---
license: mit
tags:
  - frasbergai
  - luchii
  - chat-model
  - sse-streaming
---

# Luchii-6-Plus (FrasbergAI)

Luchii-6-Plus is a long-context chat model built by FrasbergAI, supporting 128k tokens, SSE streaming, and OpenAI-compatible chat completions.

## Usage
```python
import requests

r = requests.post(
  "https://api.frasberg.com/v1/chat/completions",
  headers={"Authorization": "Bearer YOUR_KEY"},
  json={"model": "luchii-6-plus", "messages": [{"role": "user", "content": "Hello"}]}
)
print(r.json())
```

## Features
- 128k context
- SSE streaming
- Bearer authentication
- Enterprise-grade latency
