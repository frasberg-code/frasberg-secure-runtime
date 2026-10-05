# GitHub AI Extensions — Provider Declaration — FrasbergAI

**Send to:** GitHub Copilot Extensions intake (https://github.com/features/copilot/extensions)
**Subject:** Provider Declaration — FrasbergAI for GitHub AI Extensions

Hello GitHub team,

FrasbergAI declares itself as a verified LLM provider for GitHub AI Extensions.
Our provider configuration is fully compatible with your extension framework:

```json
{
  "provider": "frasbergai",
  "endpoint": "https://api.frasberg.com/v1/chat/completions",
  "auth": "bearer",
  "models": ["luchii-6-plus", "luchii-6-mini"],
  "streaming": true
}
```

FrasbergAI supports: SSE streaming · Bearer authentication · Chat completions · Embeddings · OpenAI-compatible request/response formats.

We request inclusion in the GitHub AI provider list.

Thank you,
FrasbergAI Platform Team — FRASBERG INC
