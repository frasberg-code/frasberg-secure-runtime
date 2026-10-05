# Frasberg AI API Reference — Version 1.0

Base URL:
https://api.frasberg.ai/v1/

---

## Authentication
Use your API key:
Authorization: Bearer YOUR_KEY

---

## Endpoints

### 1. List Models
GET /models

### 2. Completions
POST /completions

Body:
{
  "model": "luchii-large",
  "prompt": "Hello, Luchii.",
  "max_tokens": 256,
  "temperature": 0.7
}

### 3. Chat Completions
POST /chat/completions

Body:
{
  "model": "luchii-chat",
  "messages": [
    {"role": "user", "content": "Explain the Tri-Helix Crest."}
  ]
}

### 4. Embeddings
POST /embeddings

### 5. Moderation
POST /moderation

### 6. Tools
POST /tools/register  
POST /tools/call

---

## Regions
- us-west  
- us-east  
- eu-central  
- ap-southeast  

Use:
`?region=us-west`

---

## Errors
- 400 — Bad Request  
- 401 — Unauthorized  
- 429 — Rate Limit  
- 500 — Server Error  

---

## Contact
api@frasberg.ai
