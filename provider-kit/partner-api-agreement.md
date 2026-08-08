# FrasbergAI Partner API Agreement
Version 1.0 — August 2026

This Partner API Agreement ("Agreement") governs access to and use of the FrasbergAI API, including the Luchii model family and all related services.

## 1. Definitions
- "FrasbergAI" refers to the FrasbergAI Platform and its Luchii model family, operated by FRASBERG INC.
- "Partner" refers to any entity integrating FrasbergAI into its products or services.
- "API" refers to https://api.frasberg.com/v1 and all associated endpoints.

## 2. Authentication
Partners must authenticate using Bearer tokens:
`Authorization: Bearer {FRASBERG_LLM_KEY}`

## 3. Permitted Use
Partners may:
- Integrate FrasbergAI models into applications
- Use SSE streaming for real-time inference
- Generate embeddings for search and retrieval
- Deploy FrasbergAI in commercial products

## 4. Prohibited Use
Partners may not:
- Attempt to bypass authentication
- Redistribute API keys
- Misrepresent FrasbergAI output as another provider's output

## 5. Rate Limits & Quotas
Rate limits are enforced per API key (60 req/min standard). Enterprise limits may be negotiated.

## 6. Data Privacy
FrasbergAI does not store prompts or outputs for training. Metadata-only logging.

## 7. Termination
FrasbergAI may revoke access for violation of this Agreement.

## 8. Governing Law
This Agreement is governed by Nevada law.

By integrating FrasbergAI, Partner agrees to this Agreement.
