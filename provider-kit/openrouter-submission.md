# OpenRouter Listing Submission — FrasbergAI (Luchii model family)

Send to: https://openrouter.ai/docs/providers (provider intake) or support@openrouter.ai
Subject: Provider listing request — FrasbergAI (Luchii models, OpenAI-compatible)

---

## 1. Provider identity
| Field | Value |
|---|---|
| Provider name | FrasbergAI |
| Provider slug | `frasbergai` |
| Operator / legal entity | FRASBERG INC |
| Website | https://frasberg.com |
| Documentation | https://docs.frasberg.com |
| Contact email | admin@frasberg.com |

## 2. API details (OpenAI-compatible)
| Field | Value |
|---|---|
| Base URL | `https://api.frasberg.com/v1` |
| Chat endpoint | `POST /chat/completions` (OpenAI schema, SSE `stream: true` supported) |
| Embeddings endpoint | `POST /embeddings` (384-dim) |
| Models endpoint | `GET /models` (no auth) |
| Auth | Bearer — `Authorization: Bearer luchii-sk-...` |
| Streaming | SSE `chat.completion.chunk` frames terminated by `data: [DONE]` |
| Rate limits | 60 req/min per key (higher on request) |

## 3. Verification / discovery documents (live)
- https://api.frasberg.com/.well-known/frasbergai-provider.json
- https://api.frasberg.com/.well-known/provider-manifest.json
- https://api.frasberg.com/.well-known/openapi.yaml

## 4. Models to list
| Model ID | Type | Context | Notes |
|---|---|---|---|
| `frasbergai/luchii-6-plus` | chat | 32K | Flagship reasoning tier |
| `frasbergai/luchii-6-mini` | chat | 16K | Fast, low-latency tier |
| `frasbergai/luchii-6-embed` | embedding | 1K input | 384 dimensions |

## 5. Pricing (per 1M tokens, USD — half the market rate)
| Model | Input | Output |
|---|---|---|
| luchii-6-plus | $1.50 | $6.00 |
| luchii-6-mini | $0.30 | $1.20 |
| luchii-6-embed | $0.02 | — |
Prepaid credit packs also available: $5 / 10K, $12.50 / 30K, $50 / 150K tokens.

## 6. Test credentials
A test key can be minted instantly at https://frasberg.com/dashboard (free signup, 2,500 trial tokens per key).
We will provision a dedicated reviewer key on request.

## 7. Sample request
```bash
curl https://api.frasberg.com/v1/chat/completions \
  -H "Authorization: Bearer luchii-sk-REVIEWER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"luchii-6-plus","messages":[{"role":"user","content":"Hello"}],"stream":true}'
```

## 8. Compliance
- Content moderation: blocked-term filtering + refusal behavior on unsafe requests
- Data retention: request/usage metadata only; no training on customer prompts
- Terms: Frasberg Public License (FPL) — https://frasberg.com/laws
