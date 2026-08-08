# Frasberg / Luchii Platform — PRD

## Original Problem Statement
Awwwards-level cinematic landing page + platform for the "Luchii" multi-tier intelligence model family by Frasberg. Sovereign infrastructure, split-screen dashboard, gated chat, live voice, voice cloning, memory vault, monetized builders (Game/App/Website), Frasberg Game Platform with WebRTC streaming, multiplayer websockets and HTML5 games. Flagship 3D game "Street Vybz" (GTA-style open world) with hyper-realistic humans (ReadyPlayerMe GLB), Las Vegas realism, police/fire responses, weapons, missions.

## Architecture
- React frontend (`/app/frontend`) + FastAPI backend (`/app/backend`) + MongoDB
- Node.js WebSocket multiplayer server (`/app/frasberg-carjack/server`)
- Street Vybz game: single-file Three.js engine at `/app/games/streets/index.html` (~2200 lines), served via `/api/games/streets/play`
- Shared game assets in `/app/games/_assets/` (RPM avatars, anims, textures, SFX, env.js audio layer)

## Implemented (history)
- Luchii Builder end-to-end (AI code generation via Emergent LLM key)
- Dashboard 50/50 split-screen redesign, Gallery thumbnails/search
- Street Vybz: RPM articulated humans, missions, wanted/roadblocks, LVMPD/LVFR responses, ambulances, driver fightback, taxi fares, career persistence, gang turf, weapon arsenal + gun stores + clothing store (B key), leaderboards, gamepad + mobile twin-stick touch controls, footsteps/voices
- Collision: cars knock down peds w/ knockback, ped-ped & ped-player separation

## Implemented June 2026 (this session)
- **Vegas landmarks**: Welcome to Fabulous Las Vegas sign (blinking bulbs), Luxor pyramid + sky beam, The Sphere (animated LED globe), Stratosphere tower, High Roller ferris wheel (rotating, level cabins), Bellagio dancing fountains, ~40 palm trees, 4 facade-textured casino resorts with flickering neon marquees (all with colliders)
- **Helicopters**: 3 ambient tour choppers circling skyline + LVMPD Air One at wanted ≥4 with searchlight cone tracking player
- **Realistic cars**: glass greenhouse, painted roof, alloy rims, bumpers, grille, side mirrors, LV license plates, spoilers/exhaust (sports/muscle), taxi roof sign, truck bed, per-type proportions
- **Movement glitch fixes**: dt cap raised 0.05→0.1 (no slow-motion on low-FPS devices), ped building-collision position restore (no wall vibration), dt-clamped separation pushes, avatar anim timeScale stride-matched to speed, spawn moved to open road (0,2)
- **Mobile**: minimap moved to small top-center (76px, top:44) via CSS media query + JS — no longer blocks touch buttons; lower pixel ratio (1.2) and 1024px shadows on touch devices
- **Dancehall music**: procedural WebAudio Jamaican dancehall riddim (window.Riddim — 96BPM dembow kick pattern, bubbling A-minor bassline, offbeat skank, hats) replaces old ogg loop. NOTE: real Vybz Kartel track cannot be embedded (copyright)
- Removed corrupt trailing HTML after </html>
- Testing: iteration_27.json — 100% pass (landmarks, helis, Air One, separation, shops, riddim, mobile layout, leaderboard API, homepage regression)

## Implemented Aug 2026 (fork session)
- LINQ Governance Command Center at /linq: 45-layer Ascension Ladder, Threat/Compliance/Billing engines, LINQ Live (LiveKit tokens/rooms + Ask Luchii) — iteration_29.json 100% pass backend+frontend
- Verified Luchii API key provider flow end-to-end: mint luchii-sk-* key → Bearer auth on /api/v1/chat → real LLM streaming (70b & 1b tiers) → usage metering (requests/tokens/last_used) → 401 on fake/missing/revoked keys → revocation works
- Branding: replaced old FA emblem (/luchii-logo.webp) with new glowing Luchii mark (/luchii-mark.jpg) across all 24 usages (Navbar, Footer, Hero, ChatDemo, all page headers, Ecosystem, Brand page); removed ring borders around all mark icons
- Luchii Live Actions: agent runs real threat/billing/compliance engine scans from live chat (natural language auto-detect + quick action buttons), returns artifact cards (tag/score/recommendations) — realtime_core.py _detect_engine/_run_agent_engine, linq_governance.run_engine_core
- PayPal LINQ Billing: 3 tiers (linq-operator $15->builder, linq-architect $30->pro, linq-sovereign $60->premium) in UPGRADE_PLANS; /linq Plans tab (LinqBilling.jsx) with live PayPal checkout; capture auto-upgrades user plan. LIVE mode credentials verified (OAuth 200)
- Key Dashboard live graphs: dual-axis Requests+Tokens bars with legend, live badge, 12s auto-refresh polling
- Favicon/mark: precision circle-fit crop (Kasa fit, center 510.3/503.2 r 401.7) of glowing ring → transparent luchii-mark-circle.png used for all UI icons + favicons 16-512 + .ico (cache-bust ?v=3)
- Navbar Explore dropdown: grouped 2-column mega menu (On this page/Build/Products/Company); mobile menu 2-col grid capped 75vh
- /linq auth gate now links /auth?mode=login
- Testing: iteration_30.json — 100% pass backend + frontend (engine actions, PayPal order creation live-mode, usage daily, Plans tab, quick actions artifact cards, dropdown, regression)

## Known Constraints
- WebGL/Three.js cannot reach Cyberpunk 2077 path-traced fidelity; using ACES tonemapping, env reflections, soft shadows, neon emissives
- Production frasberg.com is a SEPARATE deployment — user must redeploy to see preview changes (recurring confusion, Cloudflare 520 history)

## Backlog
- P1: Mobile app GAME_URL wiring (React Native)
- P2: Post-processing pass (Bloom/SSAO) for extra cinematic look
- P2: Docker stack for public multiplayer
- P2: Production redeploy (user action)
- P3: Refactor streets/index.html into modules

## Credentials
See /app/memory/test_credentials.md (admin@frasberg.com / LuchiiAdmin2026!, doctester1@frasberg.com / DocTester2026!)
