# Quickstart

Get started with Luchii Engine in minutes.

## 1) Base URL

`https://api.frasbergai.com/luchii/v1/`

## 2) Authentication

Use bearer auth headers:

```http
Authorization: Bearer <token>
Content-Type: application/json
X-Luchii-Client: <app-id>
```

## 3) First API call (Market Scan)

```bash
curl -X GET "https://api.frasbergai.com/luchii/v1/market/scan?symbol=BTC/USDT&timeframe=1h" \
  -H "Authorization: Bearer <token>" \
  -H "X-Luchii-Client: <app-id>"
```

## 4) Generate Signal

```bash
curl -X POST "https://api.frasbergai.com/luchii/v1/market/signal" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTC/USDT",
    "timeframe": "1h",
    "risk_profile": "balanced"
  }'
```

## 5) Generate Next Best Line (Coaching)

```bash
curl -X POST "https://api.frasbergai.com/luchii/v1/coach/nextline" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "context": "I need a stronger opening line for this segment.",
    "persona": "executive"
  }'
```

## 6) Store Memory

```bash
curl -X POST "https://api.frasbergai.com/luchii/v1/memory/store" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "memory_type": "session",
    "content": {"event": "next-line-generated", "topic": "hook"},
    "tags": ["coaching", "session"]
  }'
```

## Conceptual Architecture Disclaimer
Any references to Sovereign architecture versions (v11–v17) are conceptual framework terms for system design visualization and roadmap communication.
