# Frasberg Self-Host Kit — Luchii Mesh

Deploy the entire Luchii platform on **your own infrastructure** — your servers, your TLS, your ingress, your scaling. No Emergent dependency.

## What's included
```
selfhost/
├── docker-compose.yml        # Full stack: backend, frontend, MongoDB, Redis, nginx, certbot
├── backend.Dockerfile        # FastAPI + Luchii Mesh WebSocket server
├── frontend.Dockerfile       # React production build served by nginx
├── nginx/nginx.conf          # TLS termination, /api proxy, WSS mesh tunnel
├── nginx/frontend.conf       # SPA config inside the frontend container
├── certbot/init-letsencrypt.sh  # One-time Let's Encrypt bootstrap
├── .env.example              # All required secrets
└── k8s/                      # Kubernetes manifests (namespace, secrets, mongo, redis,
                              #   backend, frontend, ingress + cert-manager, HPA)
```

## Quick start (Docker, single VPS)
```bash
cd selfhost
cp .env.example .env                 # fill in every value
nano .env
chmod +x certbot/init-letsencrypt.sh
./certbot/init-letsencrypt.sh        # issue TLS certs (set DOMAIN inside first)
docker compose up --build -d
docker compose logs -f
```
Your app is then live at `https://<your-domain>` with:
- REST API + SSE chat at `/api/*`
- Luchii Mesh WebSocket at `wss://<your-domain>/api/ws/mesh/<client_id>`
- Auto-renewing Let's Encrypt certificates (certbot sidecar renews every 12h)

## Kubernetes (cluster)
```bash
# Prereq: install cert-manager once
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml

cd selfhost/k8s
# Edit secrets.yaml (fill real values) and ingress.yaml (your domain) first
kubectl apply -f namespace.yaml
kubectl apply -f secrets.yaml
kubectl apply -f mongo.yaml
kubectl apply -f redis.yaml
kubectl apply -f backend.yaml
kubectl apply -f frontend.yaml
kubectl apply -f ingress.yaml
kubectl apply -f hpa.yaml
kubectl get pods -n luchii-mesh -w
```

## Environment variables (see .env.example)
| Variable | Purpose |
|---|---|
| MONGO_URL / DB_NAME | MongoDB connection |
| REDIS_URL | Mesh offline-message buffer (falls back to Mongo if unset) |
| MESH_HMAC_SECRET | HMAC-SHA256 tamper-proof message signing |
| JWT_SECRET | Auth tokens |
| EMERGENT_LLM_KEY | Luchii inference gateway key |
| PAYPAL_CLIENT_ID / PAYPAL_SECRET | Payments |
| RESEND_API_KEY / SENDER_EMAIL | Receipt emails |
| REACT_APP_BACKEND_URL | Public https URL of this deployment |

## Sovereign voice engines (optional, needs ≥8 GB RAM)
The heavy ML stack is separated in `backend/requirements-ml.txt`. To enable local
Whisper STT + Coqui TTS + XTTS voice cloning on your own hardware, uncomment the
marked line in `backend.Dockerfile`. Without it the platform runs fully with voice
in standby.

## Mesh WebSocket protocol (frasberg-secure-v1)
Client → server (JSON text frames):
```json
{ "content": "Hello Luchii", "session_id": "abc", "timestamp": 1735,
  "sig": "<hmac_sha256_hex of the payload without sig, sorted keys>" }
```
Server → client: `{"delta": "..."}` streamed chunks, then a signed final frame
`{"role":"assistant","content":"...","mesh":"frasberg-secure-v1","timestamp":...,"sig":"...","done":true}`.
Invalid signatures are rejected with `{"error":"Tamper detected — signature invalid."}`.
Messages sent to offline clients (POST `/api/ws/buffer/{client_id}`) are buffered in
Redis (24h TTL) and flushed on reconnect.
