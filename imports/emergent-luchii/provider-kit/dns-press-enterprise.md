# DNS TXT Records — Provider Verification

Add these TXT records at your DNS host (Cloudflare) for frasberg.com:

| Type | Name | Value |
|------|------|-------|
| TXT | @ | `frasbergai-provider-verification=1` |
| TXT | @ | `frasbergai-openapi=https://api.frasberg.com/.well-known/openapi.yaml` |
| TXT | @ | `frasbergai-manifest=https://api.frasberg.com/.well-known/provider-manifest.json` |
| TXT | @ | `frasbergai-models=https://api.frasberg.com/.well-known/luchii-models.json` |
| TXT | @ | `openrouter-verification=frasbergai` (optional — OpenRouter) |
| TXT | @ | `huggingface-verification=frasbergai` (optional — HuggingFace) |

Also recommended: a CNAME or A record for `api.frasberg.com` pointing at your deployed app so the manifests resolve on the api subdomain.

# Press Release

> FrasbergAI announces the public availability of the Luchii model family as a fully verified, authenticated LLM provider. The platform supports Bearer authentication, SSE streaming, long-context chat models, and high-performance embeddings. FrasbergAI is now compatible with OpenAI SDKs, Vercel AI SDK, LangChain, LlamaIndex, Supabase, GitHub AI Extensions, and OpenRouter.

Press kit assets: provider identity summary · model cards · API documentation (https://frasberg.com/docs) · SDK examples · provider manifest · OpenAPI spec · brand assets (Luchii mark, Frasberg emblem).

# Enterprise Provider Declaration

> FrasbergAI declares itself as a fully verified enterprise LLM provider offering the Luchii model family with strict Bearer authentication, SSE streaming, long-context reasoning, and high-throughput embeddings. FrasbergAI meets enterprise requirements for security, compliance, privacy, governance, and SLA enforcement. Dedicated clusters and multi-region failover are available for enterprise tenants.

# Partner Onboarding Checklist
- Base URL: `https://api.frasberg.com/v1` · Auth: Bearer · Streaming: SSE
- Models: luchii-6-plus · luchii-6-mini · luchii-6-embed
- [ ] Add provider manifest
- [ ] Add model catalog
- [ ] Add OpenAPI spec
- [ ] Add SDK examples
- [ ] Add streaming examples
- [ ] Add embeddings examples

Partner welcome: "Welcome to FrasbergAI. Your integration is now ready. Use our OpenAI-compatible endpoints with your existing clients."
