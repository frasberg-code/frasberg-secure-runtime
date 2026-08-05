# 🚗 Frasberg Carjack Game — Production Bundle

> A professional-grade, multiplayer open-world carjack game.
> Built with Node.js, WebSockets, React Native, Electron, Redis, Kubernetes, and Prometheus.

---

## 📦 Stack

| Layer | Technology |
|---|---|
| Game Engine | Vanilla JS + Canvas |
| Frontend | Vite |
| Desktop | Electron |
| Mobile | React Native (Expo) |
| Server | Node.js + WebSockets (ws) |
| Cache / Queue | Redis |
| Reverse Proxy | Nginx |
| Container | Docker + Kubernetes |
| Monitoring | Prometheus + Grafana |
| CI/CD | GitHub Actions |
| SSL | Let's Encrypt (cert-manager) |
| Security | libsodium E2E encryption + JWT |

---

## 🗂️ Project Structure

```
frasberg-carjack/
├── src/                        # Game systems (web/Electron)
│   ├── GameEngine.js           # Master game loop — wires all systems
│   ├── CarController.js        # Vehicle physics
│   ├── TrafficAI.js            # City traffic simulation
│   ├── NPCSystem.js            # Pedestrian AI
│   ├── CarjackSystem.js        # Carjacking mechanics
│   ├── HUD.js                  # Heads-up display
│   ├── AudioEngine.js          # Sound system
│   ├── SaveSystem.js           # Local + cloud save
│   ├── WorldMap.js             # World + minimap
│   ├── PoliceAI.js             # Police chase system
│   ├── MissionSystem.js        # Missions + objectives
│   ├── PhysicsEngine.js        # Collision + physics
│   ├── WeatherSystem.js        # Dynamic weather
│   ├── LeaderboardSystem.js    # Global rankings
│   ├── MinimapSystem.js        # Live minimap
│   ├── EventSystem.js          # World events
│   └── MultiplayerClient.js    # WS client
├── server/                     # Node.js multiplayer server
│   ├── multiplayer.js          # WebSocket game server
│   ├── rateLimiter.js          # DDoS protection
│   ├── authMiddleware.js       # JWT auth
│   └── redisAdapter.js         # Redis pub/sub
├── mobile/                     # React Native mobile client
│   ├── App.js
│   ├── TouchControls.js
│   ├── MobileHUD.js
│   └── MultiplayerClient.js
├── electron/
│   ├── main.js                 # Electron main
│   └── preload.js              # Secure IPC bridge
├── infra/                      # DevOps
│   ├── k8s-deployment.yaml
│   ├── prometheus.yml
│   ├── alerts/game.yml
│   └── grafana-dashboard.json
├── nginx/                      # 502/520-proof Nginx configs
├── db/                         # PostgreSQL schemas
├── .github/workflows/deploy.yml
├── docker-compose.yml
├── vite.config.js
├── package.json
├── .env.example
├── index.html
└── README.md
```

---

## ⚡ Quick Start (Local)

### 1. Clone & Install
```bash
git clone https://github.com/frasberg/carjack-game.git
cd frasberg-carjack
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Start Everything
```bash
# Start Redis
docker run -d -p 6379:6379 redis:7-alpine

# Terminal 1 — Game server
npm run server

# Terminal 2 — Web client
npm run dev

# Terminal 3 — Electron desktop app
npm run electron

# Mobile
cd mobile && npx expo start
```

### 4. Docker (Recommended)
```bash
docker-compose up --build -d
```

Game client:     http://localhost:5173
Game server:     ws://localhost:3001/ws
Prometheus:      http://localhost:9090
Grafana:         http://localhost:3000

---

## ☸️ Kubernetes Deploy

```bash
kubectl apply -f infra/k8s-deployment.yaml
kubectl get pods -n frasberg
kubectl rollout status deployment/frasberg-game-server -n frasberg
kubectl scale deployment frasberg-game-server --replicas=5 -n frasberg
```

### SSL (Let's Encrypt)
```bash
sudo certbot --nginx -d yourdomain.com -d game.yourdomain.com
```

---

## 🔑 Environment Variables

| Variable | Description | Required |
|---|---|---|
| `PORT` | Game server port (default 3001) | ✅ |
| `NODE_ENV` | `production` or `development` | ✅ |
| `REDIS_URL` | Redis connection string | ✅ |
| `JWT_SECRET` | JWT signing secret (32+ chars) | ✅ |
| `ENCRYPTION_KEY` | libsodium 32-byte key | ✅ |
| `MAX_PLAYERS` | Max concurrent players | ❌ |
| `CF_ZONE_ID` | Cloudflare Zone ID | ❌ |
| `GRAFANA_PASSWORD` | Grafana admin password | ❌ |

---

## 🎮 Game Controls

| Key | Action |
|---|---|
| `W / ↑` | Accelerate |
| `S / ↓` | Brake / Reverse |
| `A / ←` | Turn left |
| `D / →` | Turn right |
| `Space` | Handbrake / Drift |
| `F` | Carjack nearest vehicle |
| `H` | Horn |
| `M` | Open world map |
| `Tab` | Leaderboard |
| `Esc` | Pause menu |
| `F11` | Fullscreen |

### Mobile
- Left joystick — steer
- Right buttons — accelerate, brake, carjack, handbrake

---

## 🎮 Game Systems

| System | Description |
|---|---|
| TrafficAI | Simulated city traffic with pathfinding |
| NPCSystem | Pedestrians, drivers, reactive behaviour |
| CarjackSystem | Enter/exit vehicles, own cars, persistence |
| PoliceAI | 5-star wanted system, chases, helicopters |
| MissionSystem | Story + side missions with objectives |
| WeatherSystem | Rain, fog, night — affects handling |
| PhysicsEngine | Collision, suspension, weight transfer |
| LeaderboardSystem | Real-time Redis-backed global rankings |
| EventSystem | Races, heists, world events |
| AudioEngine | Spatial audio, engine sounds |
| SaveSystem | Local + cloud save |
| HUD | Health, wanted level, minimap overlay |

---

## 📡 API Endpoints

| Method | Route | Description |
|---|---|---|
| `GET` | `/health` | Server health check |
| `GET` | `/metrics` | Prometheus metrics |
| `GET` | `/api/leaderboard` | Top 100 players |
| `POST` | `/api/auth/login` | Player authentication |
| `WS` | `/ws` | WebSocket game connection |

---

## 📊 Monitoring

Import `infra/grafana-dashboard.json` into Grafana.
Connect to Prometheus datasource at `http://prometheus:9090`.

Panels included:
- Active players & connections
- Carjacks per minute
- Police chases live
- CPU & memory
- Error rate
- Players by region

---

## 🛡️ Security

- End-to-end WebSocket encryption via **libsodium**
- JWT authentication on all API routes and room joins
- Per-IP rate limiting (DDoS protection)
- HMAC-SHA256 message signing (Mesh Integrity Layer)
- Helmet.js HTTP security headers
- Cloudflare bypass for WebSocket routes
- TLS 1.3 enforced via Nginx
- Cloudflare Full (Strict) SSL

---

## 🚀 Deploy Checklist

```
☐ .env filled out completely
☐ Cloudflare SSL set to Full (Strict)
☐ Cloudflare WebSockets enabled
☐ Let's Encrypt cert issued
☐ Redis running and reachable
☐ Nginx config tested (nginx -t)
☐ systemd service enabled
☐ Kubernetes pods healthy
☐ Grafana dashboard imported
☐ Prometheus scraping game server
```

---

## 🤝 Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md)

## 📋 Changelog
See [CHANGELOG.md](CHANGELOG.md)

---

## 👑 Created by Frasberg Selassie (MR. CLAYTON-M. BERNARD-EX.)
## Owned & Operated by FRASBERG INC. — Powered by Luchii

© FRASBERG INC. All rights reserved.
