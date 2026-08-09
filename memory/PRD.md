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
- Low Credit Alerts (2026-06): _maybe_low_credit_alert in server.py — emails key owner once when key credits drop below per-key alert_threshold (default 500), flag resets on recovery. PATCH /api/keys/{id}/alert-threshold + Dashboard per-key select (data-testid=key-alert-threshold-{id}).
- Welcome Email (2026-06): _send_welcome_email in auth.py fires on register (quickstart curl included). Delivery pending domain verification.
- Tenant Detail View (2026-06): GET /api/admin/tenants/{user_id} (keys masked, purchases by email, 14-day daily usage); clickable tenant rows in Admin.jsx expand detail panel (data-testid=tenant-detail-{id}).
- Landing gap fix (2026-06): collapsible section children changed py-28→pt-8 pb-24 (Benchmarks, Capabilities, Realms, MythosTimeline, Ecosystem, Safety, Press, ApiDocs, GallerySpotlight).
- Weekly Digest (2026-06): _send_weekly_digest + _digest_loop (Mondays, db.digest_state) in server.py; POST /api/admin/digest/send-now. Emails all role=admin users: 7d signups, revenue, top-5 tenants by tokens.
- Tenant Actions (2026-06): POST /api/admin/tenants/{id}/grant-credits {amount} (wallet inc + credit_transfers kind=admin_grant), POST /api/admin/tenants/{id}/suspend {suspended} (sets user + all api_keys suspended; both bearer-key auth paths return 403 "Account suspended"; admins cannot be suspended). Admin UI: grant input/btn + suspend/reinstate btn in tenant detail, suspended badge in row.
- Alert History (2026-06): db.email_log written by all email senders (usage_receipt, low_credit_alert, welcome, weekly_digest); GET /api/emails/history (user-scoped, last 20); Dashboard "Email history" section (data-testid=email-history) with Sent / Pending-domain badges.
- Ecosystem logo fix (2026-06): removed turn-step spin from Frasberg AI + Luchii logos; all marquee logos uniform grayscale.
- Suspension Notice (2026-06): _send_suspension_notice emails tenant on suspend/reinstate (logged kind=suspension_notice).
- Digest Preview (2026-06): GET /api/admin/digest/preview (subject/html/stats via _build_weekly_digest refactor); Admin UI panel (data-testid=digest-preview-panel) with "Send to admins now".
- Export Tenants CSV (2026-06): GET /api/admin/tenants-export.csv (NOTE: hyphen path — /admin/tenants/{user_id} would capture export.csv); Admin "Export CSV" button downloads blob.
- Games loading fix (2026-06): GamesLibrary.jsx — 3x retry with backoff, skeleton loading state, distinct "Couldn't reach the game servers" + Retry button vs "No games match" + Clear-filters button; genre chips now built dynamically from data (fixes missing "Open World").
- Player Accounts (2026-06): games_portal.py — _optional_user_id (JWT cookie/bearer decode), scores now store user_id when signed in; GET /api/games/player/favorites, POST /api/games/player/favorites/{id} (toggle, db.game_favorites), GET /api/games/player/best-scores (best per game). GamesLibrary: Favorites filter chip (signed-in only), heart button on cards (data-testid=game-favorite-btn-{id}), "My best scores" strip (data-testid=my-best-scores). NOTE: player routes declared BEFORE /{game_id} routes to avoid path capture.
- Plans & Quotas (2026-06): PLAN_QUOTAS in server.py (free 30rpm/100k, pro 120rpm/2M, scale 600rpm/20M, enterprise 1200rpm/200M monthly tokens); _enforce_plan_quotas on v1 gateway key auth (429 with plan message); GET /api/quotas (user); Dashboard quota chip (data-testid=quota-chip).
- Admin Audit Log (2026-06): _audit helper → db.admin_audit; logged on grant_credits/suspend_tenant/reinstate_tenant/digest_send_now; GET /api/admin/audit; Admin panel data-testid=admin-audit-panel.
- Service Health Panel (2026-06): _REQ_METRICS deque + http middleware in server.py; GET /api/admin/health (5-min requests, avg/p95 latency, error rate, db ping, uptime); Admin panel data-testid=admin-health-panel.
- Achievement Badges (2026-06): GET /api/games/player/achievements (6 badges: first_score, high_roller, hour_played, collector, explorer, weekly_king); profile section data-testid=profile-achievements.
- Weekly Champions (2026-06): list_games includes weekly_champion (current ISO week); GameCard line data-testid=game-weekly-champion-{id}.
- Receipt error split (2026-06): _send_usage_receipt returns "sent"|"no_keys"|"send_failed"|"unavailable"; send-now returns 400 (no keys) vs 503 (delivery restricted until domain verified).
- Regression iteration_33.json: 100% backend + 100% frontend pass. Known non-blockers: hydration warning (span/option, unlocated), recharts width(-1) first paint warning.
- Player Profile + Celebrations (2026-06): GET /api/games/player/profile (favorites+best scores+playtime), POST /api/games/player/playtime (30s heartbeat from GamePlayerPage, db.game_playtime), post_score returns personal_best flag; /games/profile page (PlayerProfile.jsx, data-testid=player-profile-page) linked via "My Profile" btn in library; GamePlayerPage polls best-scores every 10s → canvas-confetti + "New personal best!" banner (data-testid=personal-best-banner). Added canvas-confetti pkg.
- Suspend Reason (2026-06): suspend endpoint accepts {reason} (stored as suspend_reason while suspended, cleared on reinstate, included in notice email); Admin UI prompts for reason.
- Game Play Counts (2026-06): POST /api/games/{id}/play-count (db.game_plays upsert, fired from GamePlayerPage on load); /api/games merges counts, list sorted by plays desc; GameCard shows plays badge for all games (data-testid=game-plays-{id}).
- Resend DNS: user is adding DKIM (resend._domainkey TXT), MX send→feedback-smtp.us-east-1.amazonses.com prio 10, SPF TXT send→v=spf1 include:amazonses.com ~all in Squarespace. As of 2026-06-08 records NOT yet propagated (checked via dnspython). AGENT CANNOT ACCESS SQUARESPACE — user must add records themselves. Once verified: set SENDER_EMAIL=receipts@frasberg.com in backend/.env + restart backend.
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

## 2026-06 (fork) — Workspace controls + Team access
- Fixed truncated LLM builds: max_tokens 4096→16384 (server.py _luchii_stream); workspace blocks publishing incomplete HTML and auto-asks agent to finish
- Agent Workspace: real file attachments (text inline / images base64, chip UI), Code tab (view+copy generated source), Need Help dropdown (Docs / Luchii Code / support), mic dictation (webkitSpeechRecognition)
- Pause/Resume: Stop square replaces Send while streaming (AbortController); Resume pill re-prompts agent with partial tail to continue seamlessly
- @frasbergai.com team domain: register/login auto-assigns plan "scale" (auth.py TEAM_DOMAIN); unlimited tokens/credits/rate across /api/quotas, /v1/chat, /v1/chat/completions, key creation (server.py _is_team_email); Dashboard shows "Unlimited"
- Verified by testing agent iteration_37.json (100% backend 8/8, 100% frontend) + manual pause/resume browser test
- Pending user actions: redeploy to frasberg.com (live domain runs old build, /api/workspace/publishes 404 there); Resend DNS on Squarespace

## 2026-06 (fork, cont.) — Team Admin Panel + Quota Alerts
- GET /api/admin/team: all @frasbergai.com members with keys, monthly tokens/requests, last active; "Frasberg Team" section added to Admin console (admin-team-panel)
- Quota alerts: _maybe_quota_alert fires after each metered gateway call — emails developer at >=80% of monthly plan quota via Resend, once per month (quota_alerts collection dedup), skips team/admin/unlimited accounts. Verified real delivery (delivered@resend.dev, ok:true in email_log)
- Text edits: workspace empty states say "ask Luchii", Dashboard subtitle "Frasberg gateway ... 60 requests/min"

## 2026-06 (fork, cont. 2) — Native App Packaging
- New /app/backend/native_packaging.py: POST/GET/DELETE /api/native/builds, GET .../download (real Android Studio project ZIP: gradle files, manifest, WebView MainActivity, app HTML in assets), POST .../publish (Google Play SIMULATION: in_review -> published after 45s with play.google.com URL)
- New NativeApps component in Dashboard (/app/frontend/src/components/site/NativeApps.jsx): app picker, name/package inputs, build button, builds list with status chips, APK project download, Play listing form
- Self-tested full lifecycle via curl (zip validated w/ unzip -l, 9 files) + dashboard screenshot
- NOTE: Google Play publish is MOCKED (no real Play Console API); APK requires user to run ./gradlew assembleDebug on the downloaded project

## 2026-06 (fork, cont. 3) — App Icons + iOS Packaging
- Icons: POST /api/native/icons/generate (gpt-image-1 via Emergent key, normalized 512px PNG), upload supported via icon_b64 on build; bundled as Android mipmaps (48-192px, manifest android:icon) and iOS AppIcon 1024 asset catalog; GET /builds/{id}/icon serves thumbnail
- iOS: platform=ios builds produce complete Xcode project ZIP (project.pbxproj w/ fixed UUIDs, AppDelegate/ViewController Swift WKWebView shell, Info.plist, bundled index.html, Assets.xcassets)
- UI: Android/iOS toggle, icon upload + AI-generate row with preview, per-row platform badges + icon thumbs; Play publish restricted to Android
- PROVED via /tmp/native_proof.py: 14 automated checks all passed (valid PNGs at exact densities, XML/plist/pbxproj/asset-JSON validity, bundled HTML byte-identical to published source) + dashboard UI screenshot
- Note: compile-level build (gradle/xcodebuild) impossible in Linux container — structural validation only

## 2026-06 (fork, cont. 4) — App Store Publish + Icon Re-roll
- iOS builds get the same SIMULATED review flow: submit -> in_review -> published (45s) with apps.apple.com URL (deterministic id from build hash); UI shows "Publish to App Store" / blue "View on the App Store" / "Published · App Store" chip
- Icon style picker (Minimal/Playful/Gradient -> ICON_STYLES prompt map) + "Re-roll icon" with random seed for distinct results each time
- Verified: iOS publish lifecycle via API, gradient re-roll produced visibly different icon, UI screenshot confirms picker + store buttons
