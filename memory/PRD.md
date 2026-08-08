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
- LINQ App tab (LuchiiFlix/cinemazone embed) hidden from public users — admin-only (role check on tab + render)
- Tip Jar Live: PayPal tips ($1-$500) in LINQ Live with on-screen 💸 burst animation + LiveKit data-channel broadcast (server.py /rooms/tip/orders + capture, linq_tips/linq_events)
- Engine Scheduler: daily auto threat+compliance scans (asyncio loop, 30-min tick, once/day), alerts on score drops (linq_alerts), bell UI in LINQ header (LinqAlerts.jsx: toggle, run-now, alert list)
- Purchase History: /api/purchases/my + 🧾 History tab (LinqHistory.jsx: plan summary + PayPal/CashApp rows) — verified 8 rows for admin
- Luchii Voice Live: TTS playback of Luchii replies via /voice/speak (voice toggle, default ON)
- Homepage: 9 info sections wrapped in CollapsibleSection accordions (content preserved, #anchor auto-expands); GalleryMarquee — Squarespace-style TWO-ROW gallery with live iframe preview cards, rows sliding in opposite directions (always visible)
- Ecosystem subtitle: "Products and platforms powered by Frasberg"
- PUBLIC API keys: free accounts can now mint up to 3 luchii-sk keys (was 402-paywalled); verified e2e with free account: mint → Bearer → /v1/chat inference → usage metering → 4th key 402 upsell
- Testing: iteration_31 (backend 100%, frontend 95% — LinqLive missing-state crash fixed by test agent patch + my corrections: voiceOn default true, withCredentials on TTS)
- NOTE: testing agent patched LinqLive.jsx in iter31; audited and kept, matches intended design
- Testing: iteration_30.json — 100% pass backend + frontend (engine actions, PayPal order creation live-mode, usage daily, Plans tab, quick actions artifact cards, dropdown, regression)

## Aug 2026 — FrasbergAI Provider Gateway + monetization
- OpenAI-compatible provider gateway in server.py: GET /v1/models, GET /v1/provider (registry+manifest+providers list incl frasbergai, verified:true), POST /v1/chat/completions (bearer luchii-sk, SSE chat.completion.chunk + [DONE], multi-turn, non-stream w/ usage), POST /v1/embeddings (luchii-6-embed, 384-dim MiniLM via memory_vault)
- Well-known verification files: /api/.well-known/{frasbergai-provider.json, provider-manifest.json, openapi.yaml} + static frontend /.well-known/*. Base URL: https://api.frasberg.com/v1 (PROVIDER_BASE_URL env overridable)
- Model aliases: luchii-6-plus→70b, luchii-6-mini→1b + legacy names
- PAID KEY MODEL (user: "we charge, half prices"): every key mints with 2,500 trial token credits; usage deducts credits for free-plan owners; 0 credits → 402 insufficient_credits w/ purchase_url; paid-plan/admin owners unmetered; credit packs HALVED: starter $5/10k, pro $12.50/30k, scale $50/150k; 13 existing keys backfilled 2500 credits
- /docs public quickstart page (curl/python/js OpenAI SDK snippets, models table, discovery links, pricing) + navbar Explore link
- Alert emails via Resend on engine score drops (linq_governance._send_alert_email → ADMIN_EMAIL)
- Usage Receipts via Resend (LIVE 2026-06): RESEND_API_KEY injected in backend/.env. Monthly auto-statement loop (_receipts_loop, runs on 1st of month) + POST /api/receipts/send-now (authed). Test email delivered to billing@frasberg.com (Resend account owner). LIMITATION: sender is onboarding@resend.dev; frasberg.com domain NOT yet verified at resend.com/domains, so delivery is restricted to billing@frasberg.com until user verifies the domain (then set SENDER_EMAIL=receipts@frasberg.com in backend/.env). User is adding DKIM/SPF DNS records in Squarespace (2026-06).
- Low Credit Alerts (2026-06): _maybe_low_credit_alert in server.py — emails key owner once when key credits drop below 500 (LOW_CREDIT_THRESHOLD), flag low_credit_alerted resets when credits recover. Hooked into both metering paths (_meter_key + chat event_generator). Verified via real metered call.
- "Email me my statement" button (2026-06): Dashboard.jsx usage header, data-testid=email-statement-btn, calls POST /api/receipts/send-now.
- Admin Tenants & Revenue (2026-06): GET /api/admin/tenants (per-user keys/requests/tokens/credits/wallet/spend + totals), rendered in Admin.jsx section data-testid=admin-tenants-panel.
- Tip leaderboard: GET /rooms/{id}/tips/leaderboard + Top tippers panel in LinqLive
- Gallery: 18 real screenshot thumbs via playwright one-off (scripts/gen_gallery_thumbs.py → /gallery-thumbs/*.jpg; NOT runtime dep); marquee img w/ iframe fallback; smart dedupe buckets; LUCHIIFLIX build hidden:true in db
- /auth defaults to LOGIN mode now (?mode=signup to register) — fixes iter29-32 carry-over
- Testing: iteration_32 — 100% backend + 100% frontend (provider gateway, docs, marquee, leaderboard); credit metering self-tested (2500→2499 deduct, 402 drain, restore)

## Aug 2026 — Dark-first + Credit UX + Auto Top-Up + OpenRouter
- Dark theme is now the default on first visit (ThemeContext getInitial → "dark"; stored preference respected)
- Favicon/browser tab: Frasberg AI emblem circle-cropped (frasberg-mark-circle.png) → all favicon sizes + .ico, cache-bust ?v=5. Luchii mark still used for in-app icons
- Credit Balance Bar: each Dashboard key row shows credits bar (green/amber/red), "Low — top up" badge <500, wallet chip in Usage header
- Auto Top-Up: wallet-based (users.credit_balance); PATCH /api/keys/{id}/autotopup {enabled,threshold,amount}; refill fires post-deduction (_maybe_autotopup, logged in credit_transfers); GET /api/wallet; credit packs purchasable INTO wallet via Pricing key-select option value wallet-{userId} (capture handles wallet- prefix). SELF-TESTED: key 100→5099 credits, wallet 10000→5000
- OpenRouter listing submission prepared: /app/OPENROUTER_SUBMISSION.md (identity, endpoints, models, half-market pricing, verification URLs, sample requests)
- FINAL REGISTRY STEP (Aug 2026): alias discovery endpoints added — /v1/provider-registry.json, /v1/provider-manifest.json, /v1/openapi.yaml, /v1/luchii-models.json + /.well-known/luchii-models.json (backend + static, all 200). LUCHII_MODELS_DOC: 128k/64k context, 384-dim embed. Full submission kit archived at /app/provider-kit/ (openrouter, huggingface, github-ai, vercel letters; model cards; DNS TXT records; press kit; framework integration docs — all using canonical api.frasberg.com)
- Provider badge meta tag live: <meta name="frasbergai-provider" content="verified"> in index.html (verified served)
- Official documents archived in /app/provider-kit/: partner-api-agreement.md, provider-sla-contract.md, enterprise-compliance-packet.md, branding-kit-and-launch.md, enterprise-contract-and-clusters.md, partner-program-and-pricing.md, developer-handbook.md


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
