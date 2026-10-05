# Changelog — Frasberg Carjack Game

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Planned
- Voice chat between players in the same room (WebRTC)
- Seasonal events (holiday heists, timed races)
- Cross-platform leaderboard API
- Spectator mode
- Gang territory system
- Custom car builder / vehicle liveries
- Battle royale mode
- Replay system
- Map editor
- Console controller support

---

## [1.0.0] — Initial Production Release

### Added — Game Systems
- **Core Game Engine** — full game loop with delta-time physics
- **TrafficAI** — dynamic traffic density, NPC vehicles with path-following
- **NPCSystem** — pedestrians with flee/react/idle behaviours
- **CarjackSystem** — player carjacking with reputation scoring
- **HUD** — speed, minimap, wanted level, health, cash overlays
- **AudioEngine** — engine sounds, tyre screech, ambient city audio
- **SaveSystem** — auto-save to localStorage with slot management
- **WorldMap** — procedural city grid with districts and spawn zones
- **PoliceAI** — wanted star system, patrol, pursuit, roadblocks, helicopter
- **MissionSystem** — objectives, timers, checkpoints, reward payouts
- **PhysicsEngine** — collision detection, friction, suspension simulation
- **WeatherSystem** — rain, fog, wind — affects NPC and player handling
- **LeaderboardSystem** — real-time Redis-backed global rankings
- **MinimapSystem** — live player dots, waypoints, zone shading
- **EventSystem** — day/night timed world events and random encounters

### Added — Multiplayer
- **WebSocket server** — rooms, state sync, 1000+ concurrent connections
- **Redis adapter** — pub/sub for multi-server horizontal scaling
- **Offline message buffering** — Redis queue, delivered on reconnect
- **End-to-end encryption** — libsodium on mobile layer
- **Rate limiter** — per-IP DDoS protection
- **JWT auth middleware** — secure room access

### Added — Infrastructure
- **Docker Compose** — one-command local + production stack
- **Nginx** — 502-proof reverse proxy, WebSocket upgrade headers
- **Kubernetes** — 3-replica deployment, HPA, PDB, rolling updates
- **Prometheus + Grafana** — real-time metrics, alert rules
- **CI/CD** — GitHub Actions: lint → test → build → docker → deploy
- **Let's Encrypt TLS** — auto-renewing SSL certificates

### Added — Platforms
- **Web** — Vite + vanilla JS, production-optimised bundle
- **Electron** — native desktop wrapper with auto-updater
- **React Native** — iOS + Android mobile client with touch controls

### Fixed
- 502 Bad Gateway eliminated via systemd auto-restart + Nginx tuning
- Cloudflare blocking resolved via grey-cloud DNS + WS bypass worker
- WebSocket disconnects fixed with 3600s proxy timeout

---

## [0.9.0] — Beta

### Added
- Initial prototype — canvas renderer, basic car movement
- Single-player carjack mechanics
- Static world map

### Fixed
- Canvas flicker on high refresh rate monitors
- Save corruption on browser storage limit

---

## [0.1.0] — Scaffold

### Added
- Project scaffold
- Basic WebSocket server
- First car sprite rendered on canvas
