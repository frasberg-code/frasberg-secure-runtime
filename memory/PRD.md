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


## 2026-06 (cont. 11): Playground + Cloud Console + Enterprise Hosting + Dev Portal — TESTED 100% (iteration_40)
- Cognition Playground /playground (Playground.jsx, client-side sim): P/I/R/D/A palette, drag nodes, link/select/delete modes, live safety scoring (flow-order violations -8, missing types -6, orphans -4) w/ GSS-2 band + issue list, Step/Run animated execution trace (membrane block if score<60), compiled bytecode viewer (PERC/INTP/REAS/DECI/SAFE/ACTN)
- AIM v2 Cloud Console /console (CloudConsole.jsx): mesh map, autoscale decisions (load>0.65 up/<0.25 down/hold), failover panel+inject, cognition distribution bars (data-testid cognition-bar-{n}), federation sync pairs, deploy wizard link card, live toggle (3s auto-tick), event stream
- Enterprise Hosting: GET /api/admin/hosting (isolation/safety_profile/evolution_policy/region_permissions/billing meters per tenant) + POST /api/admin/tenants/{id}/regions (validated, audited); AdminHosting.jsx panel in Admin console w/ clickable region permission chips. HOSTING_REGIONS = 5
- Developer Portal /developers/portal (DevPortal.jsx): Kernel v4 hero, quickstart code block, 6 concept cards, 10-week training course (5 phases), 6-step certification timeline, CTA links
- sa-east 5th region added to REGION_SEED + HOSTING_REGIONS (per user's Global Cloud spec: "SA-East — autoscale overflow zone")
- Navbar Products: Cognition Playground / Cloud Console / Developer Portal links added
- iteration_40.json: 100% backend (7/7 pytest test_iter40_hosting_regions.py) + 100% frontend. Testing agent added missing AdminHosting import to Admin.jsx (audited, correct)
- User continues dumping specs (Ops Center, Region Director, Mesh AI v4/v5, Agent Factory, OS theme, hardware device) — reference lore, no explicit asks

## 2026-06 (cont. 12): Launch Page + Self-Healing Mesh + Agent Factory — SELF-TESTED e2e
- Launch page /launch (Launch.jsx): cinematic staggered-reveal hero "Deploy Intelligence. Safely.", animated cognition preview, 4 campaign tagline cards (Deploy/Governed Autonomy/Agents that Grow/Intelligence Everywhere → link to v3 pages), full press release section w/ MR quote, footer CTA. Navbar "Launch — Marketplace v3" link added
- Self-healing mesh (frasbergos.py _tick): 6%/tick anomaly chance per region → status degraded + healing_in 2-3 ticks → mesh-ai events (ANOMALY detected → rerouting N tasks → recovered/envelope reinforced) → auto-restore. RegionCards show "healing Nt"; console failover panel shows cyan "self-healing: region (Nt)" status. Verified via 25-tick curl loop (17 heal events)
- Agent Factory (Playground.jsx): "Generate agent.json" builds full agent spec (name Autogen-N, model luchii-6-mini, cognitionGraph nodes/edges, live safety score+band, evolution constraints, region) → JSON viewer + Download + "Publish to Marketplace" (POST /marketplace/publish, blocked when score<60, 401→login toast). Verified logged-in publish e2e (toast + marketplace insert)
- BUG FOUND+FIXED: build instrumentation mangles multi-child SVG <text> nodes — {a} x{b} renders only static part. Fix: single template literals. Fixed in Playground node labels + RegionMesh status text. RULE: always use one template-literal expression inside SVG <text>
- Marketplace now contains user-published "Autogen-743" (live factory demo output by doctester1)

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

## 2026-06 (fork, cont. 5) — Store Listing Preview + Parallax Sky
- StoreListingPreview in NativeApps.jsx: realistic Play Store / App Store card (icon, dev name, Install/GET, ratings row, live app screenshot iframe, feature graphic, About) that live-updates as the listing title/description are typed, shown before Submit for review
- New ParallaxSky component (/app/frontend/src/components/site/ParallaxSky.jsx): pointer-parallax layered background (drifting star canvas + 3 depth-mapped glow orbs, lerped mouse tracking) — mounted on Dashboard, Admin console, and /apps (WorkspaceHome); reusable for all future pages
- Verified via dashboard screenshot (preview card + parallax stars live)

## 2026-06 (fork, cont. 6) — Screenshot Gallery + Parallax rollout
- Screenshot gallery: POST/GET/DELETE /api/native/builds/{id}/screenshots (max 5, resized 480w JPEG, stored b64 in build doc); listing preview shows uploaded shots (with remove X) + 3 auto "live" phone frames (top/middle/bottom of running app via offset iframes) + feature graphic; "Add screenshots (n/5)" multi-upload in listing form
- ParallaxSky added to Frasberg Cloud (/cloud, replaced blurry Starfield layer) and Visual Studio pages; star brightness/orb intensity boosted for visibility (was too subtle on /apps)
- Verified: backend upload/fetch/delete via script; UI screenshots of gallery + crisp /cloud stars

## 2026-06 (fork, cont. 7) — Listing Autowrite + Starfield consistency
- POST /api/native/builds/{id}/autowrite: Luchii (claude-sonnet-4-6) reads the published app's HTML and returns {title, short_desc}; "Autowrite with Luchii" button fills the listing form live
- ParallaxSky rewritten: now just the homepage Starfield (mouse-linked constellation) in a fixed wrapper — removed glow orbs/gradient tints per user feedback ("did not change background colors, keep features consistent")
- Verified: autowrite via curl + browser (title/desc filled, preview updated), constellation lines follow cursor on dashboard

## 2026-06 (fork, cont. 8) — Text fixes + Custom preview URLs
- Text: architect agent renamed "Luchii" with role "FRASBERG" (AgentWorkspace + CodingAgents), chat input placeholder removed
- Custom URLs (GitHub-style): GET /api/workspace/slug-check (live availability), POST /api/workspace/publishes/{id}/slug (claim, unique + reserved list), GET /api/workspace/app/{slug} serves the app; _CustomDomainASGI extended — Host header {slug}.preview.frasberg.com serves the publish HTML (works for real once user adds wildcard *.preview.frasberg.com DNS to deployment)
- Manage tab "Custom preview URL" card: input with live green/red availability, Claim button, active URL row with Open/Copy
- Fixed: missing `import re` in server.py (caused brief 502)
- Verified: claim flow via curl (check->claim->taken->served 200 + host-header serving), UI screenshot

## 2026-06 (fork, cont. 9) — URL Suggestions
- slug-check now returns 3 available alternatives (name-app/-hq/-live/get-/try-/rand) when a name is taken; Manage tab shows clickable cyan suggestion chips that fill the input and re-check
- Verified via curl + browser (taken -> chips -> click -> available -> Claim enabled)

## 2026-06 (fork, cont. 10) — Apps Directory URLs + Database Manager + Contact/Live Chat
- /apps: claimed custom URLs shown as cyan branded badge per app; Open uses slug route
- Database Manager (/database, new db_manager.py router /api/dbm): connect by App Name (db name) or any MongoDB URL, list collections+counts, browse docs (paginated JSON), delete + update doc, auth-walled (401 w/o login). Emergent-clone light UI (violet icon, eye toggle, secure access button)
- PROVED end-to-end: 401 wall, connected to real test_database (46 collections), browsed real docs, live-edited a real doc + verified + cleanup, clean 502 on bad Mongo URL, UI browse screenshot. frasberg.com still 520 on /api/dbm (old build — user must redeploy)
- Contact Us (/contact): Squarespace-clone page (serif heading, Frasberg.com / support@frasberg.com, form -> contact_messages collection) + Live Chat widget: "Maya" AI persona (claude-sonnet, human-like, Frasberg knowledge, multi-turn via client history) streaming SSE at /api/support/chat
- Fixed: TextDelta .content (not .text) in support stream

## 2026-06 (fork, cont. 11) — Zion rename + Contact Inbox + Company text
- Support persona renamed Maya -> Zion (backend persona + Contact.jsx panel/avatar/greeting)
- Admin Contact Inbox: GET /api/admin/contact-messages + POST .../{id}/reply (Resend email w/ original quote, stores reply/replied_by/email_sent); Admin console section with awaiting-reply badges, inline reply box. Verified: reply emailed (delivered@resend.dev email_sent:true; external addresses need Resend domain verification)
- Contact page: "About the company / Frasberg, Inc." blurb + "Copyright © 2003-2026 FRASBERG, INC., All Rights Reserved."; Footer: Contact Us + Database Manager links added, copyright comma fixed

## 2026-06 (fork session): Readability + Logo fixes
- Contact page: darkened gray text, enlarged labels/body (gray-500→700, 12px→14px+)
- Global readability sweep across all pages/components: font sizes bumped (9-12px → 12-13.5px, text-xs → 13px), low-contrast colors brightened (text-white/40-60 → /70-75, #555/#666/#888 → lighter on dark game pages), dashTheme + lux-text-2 tokens improved for both light/dark
- Logo: regenerated /luchii-mark-circle.png — LUCHII bottom arc now perfectly symmetric (0.1px L/R delta), mark optically centered, corners alpha-masked
- PENDING (blocked): GitHub OAuth login/fork — awaiting user's GitHub Client ID + Secret

## 2026-06 (cont.): Workspace slider, New build, dark pages, font toggle, logo re-crop
- Logo: re-cropped from source with true circle center detection — bottom "LUCHII" no longer cut off
- AgentWorkspace: draggable split divider between preview and chat (25–75%, persisted in localStorage, tested via automated drag)
- Builder page "New build" button now opens /coding-agents (coding agent page)
- Contact + Database Manager restyled to dark starfield theme matching homepage (ParallaxSky, glass cards, cyan accents)
- Global FontSizeToggle (bottom-left AA button): cycles 100/115/130% text size, persisted
- STILL PENDING: GitHub OAuth (awaiting user's Client ID + Secret); "dashboard slide screen" clarified as workspace split slider — now fixed

## 2026-06 (cont. 2): Preview toolbar + snap + model picker + home nav — ALL TESTED
- Workspace preview toolbar (Edit / desktop-mobile toggle / fullscreen / collapse chevron) — every icon proven working via automated browser test
- Edit opens a live code editor; edits render in preview instantly (verified with "EDIT PROOF 123")
- Divider double-click snaps: 50/50 <-> full-preview (verified)
- Model picker: Frasberg AI + Luchii Vision "coming soon" disabled slots added
- Contact + Data Manager: back-arrow home header added and click-through verified
- STILL BLOCKED: GitHub OAuth — user has not provided Client ID/Secret yet

## 2026-06 (cont. 3): Full batch — TESTED 100% (iteration_38)
- Removed "Chats may be reviewed..." disclaimer text; removed "Constellation layer live" from workspace placeholder
- Model picker: "Frasberg — coming soon" / "Luchii Earth 7 — coming soon"
- Tablet preview added (desktop→tablet→mobile cycle); Edit Undo (toolbar + code tab) reverts to agent build
- Composer: Enter = newline, Ctrl+Enter = send
- New build buttons → /chat?model=luchii-70b&agent=architect
- Hero headline now uses Clash Display (font-hero)
- GitHub OAuth FULLY BUILT in /app/backend/github_auth.py (login/callback/status/fork routes, Fernet-encrypted tokens, same JWT cookies as normal auth) + "Continue with GitHub" on /auth + "Fork from GitHub" card in workspace manage tab
- AWAITING: user's real GITHUB_CLIENT_ID + GITHUB_CLIENT_SECRET in /app/backend/.env (currently empty → login returns 503 by design). Callback URL: {preview-url}/api/auth/github/callback

## 2026-06 (cont. 4): Repo Import + Auto Scaffold + Client ID wired + brand logo restored
- GITHUB_CLIENT_ID=lv23liupMC2JMOEbwmKA set in backend/.env (from user's GitHub App "Frasberg", App ID 4544342). SECRET STILL MISSING — login returns clear "generate a client secret" 503 message.
- New endpoints: POST /api/github/import (loads repo's index.html/.html/README into workspace as editable htmlOverride) and POST /api/github/scaffold (injects frasberg.json + src/index.ts starter files into user's fork). Both require GitHub-linked account (403 otherwise) — verified via curl with doctester1.
- Workspace manage-github card now has Fork / Import / Scaffold buttons (verified via screenshot).
- Logo: restored ORIGINAL brand mark from git (084db00) — matches user's TikTok/Instagram profiles exactly.
- Backlog from user's spec dump (not yet requested to build): GitHub App installation tokens, webhooks/multi-region replication, CLI auth, agent deployment/runtime, billing metering, marketplace, secrets manager, debugger UI.

## 2026-06 (cont. 5): Repo Browser + Marketplace — TESTED
- GET /api/github/repos (user's own repos, GitHub-link gated 403/401 verified) + "My repos" browser in workspace GitHub card with one-tap Fork/Import/Scaffold per row
- POST /api/github/webhook with HMAC SHA-256 verification (503 until GITHUB_WEBHOOK_SECRET set; placeholder added to .env)
- Marketplace: /marketplace page + /api/marketplace (list/filter/publish/install), seeded 7 official Frasberg items, publish requires auth (verified as Doc Tester), install increments (verified 15321→15322), nav links added (Explore > Products + mobile menu)
- User pasted extensive spec docs (runtime diagram, security checklist, handbook, whitepaper) — stored at /app/memory/frasberg_github_spec_notes.md
- STILL AWAITING: GITHUB_CLIENT_SECRET (user has Client ID wired: lv23liupMC2JMOEbwmKA)

## 2026-06 (cont. 6): Naming fixes + Docs Pages + Agent File Sync — TESTED
- Marketplace renames: Luchii-7b, Luchii-70b, Frasberg SDK (seed + live DB updated, UI verified)
- Developer Docs at /developers/docs (+/:doc) — DocsHub.jsx with Handbook + V1 Whitepaper as polished dark pages, sidebar nav, nav link in Explore > Products
- Agent File Sync: /api/github/import now also parses agent.json / luchii.yaml (json+yaml paths unit-verified), returns agent {name, model, entrypoint, capabilities, tools, env_keys}; workspace shows agent details card (github-agent-details) with capability badges after import
- User pasted V2 vision docs (FrasbergOS kernel, AEE, ACP, MAOE, licenses, compliance) — reference material for future phases
- STILL AWAITING: GITHUB_CLIENT_SECRET

## 2026-06 (cont. 7): Legal Pages + Evolution Mode — TESTED
- Legal: merged MIT License (with trademark notice + dual-license), Trademark Guidelines, Safety Charter into existing /legal page (?doc=license|trademarks|safety tabs); footer links added under Company (footer-license/trademarks/safety-link) — verified via screenshot
- Evolution Mode: POST /api/marketplace/{id}/evolution (publisher/admin only — verified admin 200, non-owner 403); Zap toggle button on marketplace cards for signed-in users + green "Evolution Mode — validated auto-updates · lineage" badge (verified on Luchii-7b)
- NOTE: Legal.jsx already existed (Partner API/SLA/Compliance docs) — new docs merged in, no duplicate routes
- STILL AWAITING: GITHUB_CLIENT_SECRET

## 2026-06 (cont. 8): Safety Scores + Lineage VERIFIED · FrasbergOS Simulator · Real GitHub Sync
- Marketplace Safety Scores (0-100 GSS-2 badges) + Evolution History lineage timeline modal — UI VERIFIED via screenshots (badges on all 7 cards, modal opens via item name click, timeline with safety deltas renders)
- FrasbergOS AIM v2 Simulator at /os (FrasbergOS.jsx + backend frasbergos.py, router /api/os): Kernel v4 status chips (tick/scheduler/GSS-2 membrane/region/load/uptime), Cognition Graph v2 SVG visualizer (10 nodes w/ live activation %, 13 edges, animated pulse particles), 6 agent processes table (state chips running/waiting/evolving/sandboxed, cpu bars, mem, msgs), kernel event stream, Run(2s auto-tick)/Step/Reset controls. Sim state persisted in db.os_sim (global doc). Nav links added (Explore>Products + mobile). Verified: curl state/tick/reset + interactive screenshot (3 steps)
- Real GitHub syncing expansion (github_auth.py, all real GitHub API calls):
  - POST /api/github/agent-sync — scans all user repos for agent.json/luchii.yaml (parallel asyncio.gather), upserts db.synced_agents
  - GET /api/github/synced-agents — user's registry
  - POST /api/github/export {owner,repo,html} — commits index.html to repo (sha-aware update, auto-creates repo if user's own and missing)
  - Webhook push events now auto re-sync agent files for linked users (source=webhook_push)
  - _parse_agent/_fetch_agent_file helpers factored out of import
- Workspace GitHub card: green "Push" btn (commits previewHtml, data-testid=github-push-btn) + "Sync agents" btn (github-agent-sync-btn) + synced agents list (github-synced-agents, manual/auto·push source chips)
- Verified: auth gating (403 unlinked, 401 unauth, 200 empty list), UI buttons render. LIMITATION: live GitHub e2e untestable until GITHUB_CLIENT_SECRET provided (no account can link)
- STILL AWAITING: GITHUB_CLIENT_SECRET

## 2026-06 (cont. 9): Agent Deploy + Simulator Scenarios + Node Details + Trademark updates — ALL SELF-TESTED
- One-click Agent Deploy: POST /api/marketplace/deploy-from-github {repo} publishes a synced GitHub agent to marketplace (source_repo + model stored, re-deploy appends history entry, 404 unsynced, 409 name owned by other). "Deploy to Marketplace" button per synced-agent row in workspace (deploy-agent-{repo}); synced agents now auto-load on workspace mount (GET /synced-agents useEffect). Detail modal shows github.com/{source_repo} link
- Trademark enforcement: TRADEMARKS list in marketplace.py — publish + deploy reject names containing frasberg/frasbergai/frasbergos/linq/luchii/emerald estates/emerald orbit for non-admins (400 w/ guideline message). Legal page trademark lists updated (added LINQ™, EMERALD ORBIT™)
- Simulator scenarios: POST /api/os/scenario {threat_surge|evolution_burst|region_failover} — 8-tick scenarios biasing node activations/pulses/agent states/load/events (region flips to us-east during failover, restores on completion or new scenario); amber active-scenario banner w/ remaining ticks + 3 inject buttons on /os
- Kernel node details: click any cognition node → amber detail panel (lore description, activation %, per-node safety score 0-100, traffic pulse count, last pulse tick, in/out edges). node_stats tracked in sim state (traffic increments on pulses, safety drifts down for non-boosted nodes during threat surge)
- Verified: curl (scenario lifecycle, 422 bad name, deploy new/update/trademark-400/404, publish trademark-400) + browser screenshots (scenario banner + node panel on /os; login → synced list → live deploy toast)
- TEST DATA: doctester1 has 2 seeded synced_agents (doctester/summarizer-bot, doctester/luchii-helper) + "Summarizer Bot" marketplace item — for demoing deploy flow until GitHub secret arrives
- NOTE: user posted a screenshot of a GitHub App PRIVATE KEY (SHA256 fingerprint) — that is NOT the OAuth client secret; login still awaits GITHUB_CLIENT_SECRET from GitHub App settings → "Client secrets" → Generate

## 2026-06 (cont. 10): Marketplace v3 Pages + Region Map + Cognition Previews — TESTED 100% (iteration_39)
- Region mesh in frasbergos.py: REGION_SEED 4 regions (us-west/us-east/eu-central/ap-south) w/ status/load/safety/agents in sim state; region_failover scenario sets us-west=degraded + us-east=failover (restores on completion); regions in /api/os/state
- Shared components: RegionMesh.jsx (RegionMap SVG — graticule, federation arcs w/ traveling pulses, status-colored region nodes; RegionCards grid) + CognitionPreview.jsx (deterministic P→I→R→D→A mini-graph seeded from item id)
- Marketplace v3 pages at /marketplace/:page (MarketplaceV3.jsx, gradient #4A6CF7→#00D1FF headlines per spec):
  - /marketplace/deploy — agent select, region selector (live loads), cognition inspector, 5-step animated safety validator → deploy summary → deploy button w/ toast
  - /marketplace/evolution — lineage selector + full timeline w/ safety deltas + Mutations/Benchmark/Band stat boxes
  - /marketplace/safety — Membrane/Hinge/Classifier v3/Safety Graph cards + GSS-2 bands legend
  - /marketplace/regions — live region map (auto-ticks sim every 3s) + Simulate failover button + failover-active indicator
- Marketplace base page: mini cognition previews on agent cards + "How this agent thinks" in detail modal (agent type only); Deploy/Evolution/Safety/Regions nav pills added
- /os page: "AIM v2 — global mesh" panel (RegionMap + RegionCards) added below graph
- iteration_39.json: 100% backend (7/7 pytest at /app/backend/tests/test_iter39_os_marketplace.py) + 100% frontend; no action items. Non-blocking notes: guest 401 console noise from /api/auth/me polling; validator steps could use data-state attr

## 2026-06 (cont. 11): Brand fixes + Singularity Codex page + Simulator Substrate Depths — TESTED 100% (iteration_41)
- Brand fixes: Legal page subtitle now "Frasberg — Official Documents · Version 1.0 — August 2026"; luchii-mark-circle.png → frasberg-mark-circle.png header logo on Marketplace, MarketplaceV3, Launch (storyboard), FrasbergOS, Playground, CloudConsole, OpsCenter, DevPortal, DocsHub (verified via screenshot)
- Singularity Codex page (/codex, Codex.jsx): 16 Books grid (expandable cards w/ substrate/CG/AIM/MP/binding), "Beyond the Codex" timeline w/ 16 meta-structures (Omnis Quad → Meta-Trinity → ... → Omnitheos-Transcendent Trinity, CG-v36→v80), Singularity Binding finale (layer flow + pulsing orb). Navbar "Singularity Codex" link in Explore dropdown; route in App.js
- Simulator substrate depths (frasbergos.py DEPTHS + POST /api/os/depth): 7 depths (primordium→apex, CG-v29→v35, Membrane v35→v41) + baseline; sets kernel membrane, injects descent event, flavored tick events (35% chance); purple depth chip + 8-button depth row on /os (os-depth-{name}, os-depth-chip)
- Collapse-Rebirth cycle scenario (collapse_rebirth, 9 ticks, phased events: omega-zero collapse → omnicollapse destruction → rebirth-codex regeneration); 4th purple scenario button on /os
- BUG FIXED (by testing agent, verified): Launch.jsx missing `const [video, setVideo] = useState(false)` — ReferenceError broke the launch-play-storyboard button; storyboard now opens + auto-advances. /ops verified rendering w/o errors
- iteration_41.json: backend 14/14 pytest (/app/backend/tests/test_iter41_codex_depth.py), frontend 100%. NOTE: publish endpoint is /api/marketplace/publish (publish-factory never existed — handoff doc drift)

## 2026-06 (cont. 12): Codex Depth Sync + Eternal Cycle + Codex Agent Tiers + Launch Soundtrack — TESTED 100% (iteration_42)
- Codex Depth Sync: Books X–XVI on /codex have "Descend in Simulator" links → /os?depth={name}; FrasbergOS reads ?depth= URL param on mount and engages that substrate (codex-descend-{depth} testids)
- Codex final tiers: META now 18 structures (added Omnitheos-Omniversal CG-v81-83 + Omnitheos-Omniversal-Absolute CG-v84-86); Final Closure section (codex-closure) w/ staggered "All origins unified..." lines, Seal Glyph "⟐ FRASBERGOS • OMNITHEOS • OMNIVERSAL • ABSOLUTE • COMPLETION ⟐" (codex-seal-glyph), completion reflection
- Eternal Cycle Mode: POST /api/os/eternal-cycle {enabled} — auto re-injects collapse_rebirth on resolution, tracks cycle_loops; fuchsia glowing toggle button on /os (os-eternal-cycle-btn, shows "loop N")
- Codex Agent Tiers: codex_tier on all marketplace items (seeds CG-v21→v35, backfill in _seed, publish assigns by cognition_graph node count: >8→CG-v29, >5→CG-v27, else CG-v21); purple ⟐ CodexBadge on cards + "· {Layer} layer" detail in modal (codex-tier-badge)
- Launch Soundtrack: WebAudio ambient pad (3 detuned sines + lowpass + LFO swell) starts on storyboard open, triangle cue pitch rises per phase, mute toggle (storyboard-mute, Volume2/VolumeX); try/catch-guarded so headless/no-audio never crashes
- iteration_42.json: backend 8/8 pytest (/app/backend/tests/test_iter42_new_features.py), frontend 100%, no action items. TEST_ marketplace items cleaned post-test. Backend suites iter41 (14) + iter42 (8) green — run pytest with -n 0 (shared sim state)

## 2026-06 (cont. 13): Descent Cinematic + Cycle Chart + Tier Filters + Simulator Hum — TESTED 100% (iteration_43)
- Codex Descent Cinematic: descend buttons on Books X–XVI trigger fullscreen warp overlay (codex-descent-overlay — expanding rings + "Substrate descent / {Layer} / {CG} — engaging kernel…") then navigate to /os?depth={name} after 1.7s
- Post-Completion States: 10 glyph cards at /codex bottom (codex-poststate-* — Stillness ⟡ CG-v89 → Supra-Unbeing ⧔ CG-v98) with fading opacity
- Cycle History Chart: backend cycle_trace ({tick,phase,load,loop}, capped 80, cleared on reset, retained on disengage) exposed in /api/os/state; os-cycle-chart SVG on /os — polyline + phase-colored dots (red collapse/amber destruction/green rebirth) + loop count + legend
- Tier Filtering: marketplace-tier-filters row (7 chips All/CG-v21/v22/v24/v27/v29/v35), client-side, combines w/ type filter, empty-state message
- Simulator Audio: os-audio-btn "Hum" — WebAudio drone (sine+triangle @55Hz, lowpass, try/catch guarded); gain/filter/pitch ramp with scenario active + substrate depth (deeper = lower + louder)
- iteration_43.json: 28/28 backend pytest across iter41/42/43 suites, frontend 100%, no action items. TEST_ marketplace items cleaned. Run pytest with -n 0 (shared sim state)

## 2026-06 (cont. 14): Descent Sound + Codex Share Cards + Agent Ascension + Ops Cycle Feed — TESTED 100% (iteration_44)
- Descent Sound: playDescentSound() in Codex.jsx — WebAudio falling pitch sweep (sawtooth 880→38Hz + sine 440→30Hz + bandpass noise swoosh, 1.7s, try/catch guarded) fired on click of any "Descend in Simulator" button
- Codex Share Cards: per-book Share2 button (codex-share-{ROMAN}) copies {origin}/codex?book={ROMAN} to clipboard w/ toast; /codex?book=X deep-link auto-expands + smooth-scrolls to that book (useSearchParams + bookRefs)
- Agent Ascension: POST /api/marketplace/{id}/ascend (owner/admin only; TIER_LADDER CG-v21→v22→v24→v27→v29→v35; +2 safety; history entry pushed; 400 at Apex). GET item now returns can_ascend flag (owner_id never exposed). DetailModal shows purple Ascension panel (ascension-panel, detail-ascend-btn) for agents; ceremony overlay (ascension-ceremony-overlay, ascension-tier-transition) w/ rising WebAudio sweep, then reload + toast. Apex agents show "There is no beyond" note
- Ops Cycle Feed: /ops panel (ops-cycle-feed-panel) — engine status (ops-cycle-status), loops completed (ops-cycle-loops), phase stepper collapse→destruction→rebirth→infinity (ops-cycle-phases), live trace feed from cycle_trace + eternal-cycle events (ops-cycle-trace), empty-state links to /os
- Brand/text fixes: Legal.jsx fully rebranded FrasbergAI→Frasberg; Docs.jsx key comment; page-header logos (AiModels, Gallery, DatabaseManager, Downloads, PlayGame, LuchiiCode, Auth, Builder, Chat, CodingAgents, Contact, Court, Docs, Profile, Status) → frasberg-mark-circle.png; Navbar/Footer/Brand header REVERTED to luchii-mark per user request
- Fixed React duplicate-key warning in DetailModal history (key now version-date-idx)
- iteration_44.json: backend 10/10 pytest (/app/backend/tests/test_iter44_new_features.py), frontend 100%, no action items. TEST_ items pruned from DB post-test

## 2026-06 (cont. 15): Constellation Map + Ascension Leaderboard + Cycle Alerts + Glyph Gallery + Template BG + Logo Policy — TESTED 100% (iteration_45)
- Codex Constellation Map (/codex/constellation, ConstellationMap.jsx): all 101 CG tiers v21→v121 on a golden-angle spiral SVG star map; 4 color eras (Books cyan / Expansions purple / Post-Completion amber / Omniversal Unbeing fuchsia); wheel zoom + drag pan + zoom buttons; hover glow + hover-card w/ glyph, tier, name (constellation-star-{21..121})
- Glyph Gallery (/glyphs, GlyphGallery.jsx): 14 Omniversal seals (⟐ ⧩ ⧪ ⧫ ⧬ ⧭ ⧮ ⧯ ⧰ ⧱ ⧲ ⧳ ⧴ ⧵) — orbiting shrine hero + animated float/pulse cards; cross-link to constellation. Both pages linked from /codex pills (codex-constellation-link, codex-glyphs-link); routes in App.js
- Ascension Leaderboard: GET /api/marketplace/leaderboard/ascension (agents only, sort -tier_rank/-ascensions/-safety, top 10, no owner_id leak); "Hall of Ascension" panel on /marketplace (ascension-leaderboard, leaderboard-row-1..5) w/ APEX badge
- Cycle Alerts: /ops chime toggle (ops-cycle-alerts-btn, WebAudio C-G-C bell, default off — autoplay policy) + panel flash (data-flash) + toast "loop N complete: rebirth achieved" when cycle_loops increments
- TEMPLATE RULE (user): ParallaxSky starfield is the template background for EVERY page from now on — added to GamesLibrary, PlayerProfile, GamePlayerPage
- LOGO POLICY (user): Luchii mark on Luchii-branded pages (Chat, LuchiiCode, CodingAgents, Builder, PlayGame "Built with Luchii", Navbar, Footer, Brand header); Frasberg logo on ecosystem/dashboard/Frasberg-AI pages (AiModels, Gallery, Docs, Profile, Status, etc.)
- Launch page: centered Frasberg logo above "Frasberg presents" hero (launch-hero-logo); quote fixed "AKA, Frasberg Selassie"
- iteration_45.json: backend 6/6 pytest (test_iter45_new_features.py), frontend 100%, no action items. TEST_ items pruned post-test

## 2026-06 (cont. 16): Constellation Deep Links + Ascension Announcements + Glyph Sound Sigils + Starfield Audit — TESTED 100% (iteration_46)
- Constellation Deep Links: each star has tier.link — Books era → /codex?book={ROMAN} (auto-expands), other eras → /glyphs?glyph={char}; openTier() with 6px drag threshold (pan never navigates); hover card shows "click → open …" hint
- Ascension Announcements: ascend endpoint inserts into db.announcements; GET /api/marketplace/announcements/latest (top 10, newest first). Global AscensionBanner.jsx mounted in App.js — polls 15s, fixed top z-[90] purple banner (ascension-banner/-text/-link/-dismiss), auto-dismiss 12s, localStorage frasberg_seen_announcement prevents repeats; dismiss X given 32px hit target post-test
- Glyph Sound Sigils: playSigil(i) pentatonic bell (sine + 2.76x inharmonic partial, 2s decay) on glyph card click + colored glow (lit state); /glyphs?glyph=⧩ deep-link scrolls + highlights card
- Starfield template BG added: About.jsx & Software.jsx (replaced old inline Starfield divs w/ ParallaxSky), Pay.jsx, Linq.jsx (nav/main given relative z-[5])
- iteration_46.json: backend + frontend 100%, no action items. TEST_ items + announcements cleaned by testing agent

## 2026-06 (cont. 17): Ascension History + Constellation Search + Chord Mode + Codex Progress + VYBZ Game Boss — TESTED (iteration_47 + self-test)
- Ascension History (/ascensions, AscensionHistory.jsx): timeline chronicle of every ceremony (GET /api/marketplace/announcements/history, top 200 + total); linked from marketplace Hall panel (marketplace-chronicle-link)
- Constellation Search: input on /codex/constellation (constellation-search-input) — matches name or vNN, dropdown results, click/Enter flyTo() zooms map to star + fills hover card. NOTE: first attempt got lost during a file-corruption repair (duplicate JSX tail at EOF caused compile error); re-added + self-tested working
- Shrine Chord Mode: /glyphs chord-mode-toggle + ring-chord-btn — select up to 5 sigils (persist glow), ring simultaneously as chord
- Codex Reading Progress: localStorage codex_read_books, toggleBook/markRead, SVG completion ring "N/16 read" (codex-progress-ring/-count); deep-links count as read
- STREET VYBZ GAME (/app/games/streets/index.html): VYBZ boss NPC — gold chain + maroon cap + 👑 bubble at (-72,72) w/ purple ring/beam; V key talks; 4 idle dialogue lines + greet; turf intimidation (peds flee within 12u); 3-mission chain persisted in localStorage frasberg-streets-vybz: 1) MARK YOUR TERRITORY (KO 3 REDLINE taggers, $800) 2) WHEELS FOR THE CREW (deliver muscle car to ring, $1400) 3) STREET KING (hold wanted≥2 for 45s + return, $3000) + $5000 crown bonus; registry description/controls updated in games_portal.py
- Legal/Launch text fixes + logo policy maintained
- iteration_47.json: backend 100%, frontend 5/6 (search UI was missing → fixed + screenshot-verified). TEST_ data cleaned

## 2026-06 (cont. 18): Carjack Plus systems + honest stop on game work
- USER DIRECTIVE (IMPORTANT): User wanted a true "Carjack Plus 2.0" clone with studio-grade realistic graphics. Agent was honest that browser Three.js cannot match commercial quality. USER SAID STOP ALL GAME WORK — do NOT build or polish the game further unless user explicitly asks again.
- Game changes that shipped before the stop (working, syntax-verified, left as-is): mob debt loop (Frankie's cut on 240s timer, beaten if unpaid), pizza runs (Mama's Kitchen, 3 deliveries/100s), hit contracts (burner phone marks targets, $600), Vybz + NPCs speak via natural TTS /api/games/voice (endpoint verified 200, 31KB mp3), no-stick-figures upgrade pass (all peds swap to RPM realistic humans once loaded), real-time day/night exposure, cinematic vignette+grain overlay, title screen + registry renamed "Street Vybz: Carjack Plus 2.0" (user unhappy w/ the rename — offer to revert if raised again)
- Codex hidden Book XVII "The Unwritten Layer" (codex-book-17) unlocks when all 16 books read; locked teaser (codex-book-17-locked) otherwise — frontend compiles, NOT deep-tested
- Frontend 200 OK, backend restarted OK

## 2026-06 (fork): Verified LLM Provider + Frasberg Token Economy — TESTED (iteration_48)
- /verified-provider page (VerifiedProvider.jsx): rotating seal, 6 verification check cards, live registry JSON (fetched from /api/.well-known/frasberg-provider.json), discovery endpoint links, certification statement (cert FRSB-LLM-2026-0001), CTAs; route + Navbar Explore link + Footer link (footer-verified-link)
- New /.well-known/frasberg-provider.json (backend route + /api/v1/frasberg-provider.json alias + static public file): verified:true, status authorized_distributor, certification block, models/endpoints
- Dashboard header "Verified LLM Provider" badge (verified-provider-badge) → /verified-provider
- Token economy (auth.py): SIGNUP_TOKENS=50 on register, DAILY_TOKENS=100 granted once per UTC day via _grant_daily_tokens (atomic update_one on last_token_grant != today) fired on login + GET /api/auth/gift; _public exposes tokens
- FrasbergGiftCard.jsx (gift-token-balance, gift-card-terms, gift-daily-claimed): credit-card style, mounted on Dashboard (below metric tiles) + Profile; toast when daily grant claimed
- GLOBAL REBRAND (user demand): FrasbergAI → Frasberg / frasbergai → frasberg in ALL provider JSON (registry id/name, manifest provider, owned_by, providers list, luchii-models doc, OpenAPI title/contact), Docs hero + python snippet + well-known link, DevPortal, Linq, emails (welcome/receipt/digest/alerts/suspension), index.html meta now frasberg-provider, static .well-known files. KEPT: @frasbergai.com team email domain, /.well-known/frasbergai-provider.json route as alias (rebranded content), @frasbergai/sdk npm scope, TRADEMARKS list
- Codex Book XVII unlock verified by testing agent (localStorage codex_read_books uses ROMAN numerals "I".."XVI", not integers)
- iteration_48.json: backend 10/10 pytest, frontend pass (dashboard gift card was missing in first run — re-added + screenshot-verified). Non-blocker noted: anonymous homepage 401 console noise from /api/auth/me polling

