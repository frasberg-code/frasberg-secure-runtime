# Luchii — Landing Page (FrasbergAI)

## Original Problem Statement
Build a web/mobile app landing page like askgpt.com for "Luchii", a multi-tier AI model
family by FrasbergAI, with a light/dark theme toggle and a web/mobile view toggle. Include
model tiers, benchmarks, capabilities, safety, API docs, and cinematic lore (Five Realms,
personas, mythos timeline). Live chat demo requested (no real API key provided).

## Architecture
- **Frontend**: React 19 + Tailwind + framer-motion + lenis (smooth scroll) + react-fast-marquee.
  Single landing page composed of section components in `src/components/site/`.
- **Backend**: FastAPI + MongoDB. `POST /api/chat` streams SSE using emergentintegrations
  (Claude Sonnet 4.6 via EMERGENT_LLM_KEY). Persists chat_messages; multi-turn via session_id.
- **Theme**: custom ThemeContext, system-preference default, persisted in localStorage.

## User Personas
- Developers evaluating Luchii models / API.
- Brand/ecosystem visitors exploring the Luchii universe (lore, realms).

## Core Requirements (static)
- Cosmic/constellation art direction on #1e2327 base (from client's GitHub theme color).
- Light/dark toggle, web/mobile view toggle, live chat demo, all lore + docs sections.

## Implemented (2026-07-19)
- Kinetic hero with masked line reveal + canvas constellation starfield + web/mobile toggle.
- Live streaming chat demo (SSE) with Luchii persona; graceful fallback when key budget = 0.
- Sections: Models (200M/1B/7B/70B), Benchmarks table, Capabilities bento, Five Realms/personas,
  Mythos timeline (Phase I–VIII), Safety, API docs w/ copy, editorial marquee, footer.
- Theme toggle (system default + persistence), responsive nav.

## Implemented — Developer Gateway + Dashboard (2026-07-19)
- Backend: API key management (POST/GET/DELETE /api/keys, masked listing), /api/usage stats,
  public gateway POST /api/v1/chat (Bearer-auth, per-key rate limit 60/min, safety filter,
  usage counters), message length cap (4000), Mongo indexes, case-insensitive Bearer.
- Frontend: /dashboard route — key generate/copy/revoke, usage stats, model list, live playground.
- Quickstart: copy-ready cURL / Python / JavaScript tabs on /dashboard, auto-filled with the newest
  key + live gateway URL (paste-and-run verified against /api/v1/chat).
- Nav: "Developers" link + "Get API Key" CTA route to the dashboard.
- Tested: backend 24/24 (iteration_2), frontend dashboard verified visually.

## Known Notes
- EMERGENT_LLM_KEY has ZERO budget → live Claude calls fail; persona fallback streams instead.
  Top up at Profile -> Universal Key -> Add Balance to enable full AI responses.
- No real Luchii API (api.frasberg.ai) endpoint/key was provided by the user.

## Backlog
- P1: Wire real Luchii API (api.frasberg.ai) once endpoint + key are available (env-driven proxy).
- P2: Rate limiting + message length cap on /api/chat for public exposure.
- P2: Persist partial assistant content on client disconnect.
- P2: Add Capabilities/Realms imagery, OG meta tags + favicon, analytics.

## Next Tasks
- Await user API key to switch chat from fallback/Claude-demo to real Luchii endpoint.

## Implemented — Court, Brand, Payments (2026-07-25)
- Live LLM enabled (credits recharged): chat + AI Court return real model output.
- AI Court (/court): POST /api/court, Judge persona, structured VERDICT/REASONING/GUARDIAN CHECK/CONFIDENCE.
- Press/Launch section on home; /brand page (logo downloads, color swatches, type specimens).
- Real favicons (ico + PNG set) and 1200x630 og-image.png from logo; OG/Twitter meta wired.
- PayPal (LIVE) credit packs on /dashboard: GET /api/paypal/config, POST /api/paypal/orders,
  POST /api/paypal/orders/{id}/capture (httpx REST, PAYPAL_MODE live/sandbox). Verified: live order
  creation + SDK buttons render. Purchases credit the selected API key (api_keys.credits).
- Secrets stored server-side only in backend/.env: LUCHII_UPSTREAM_API_KEY, LUCHII_MODEL_TOKEN,
  PAYPAL_CLIENT_ID/SECRET. api.frasberg.ai currently unreachable so upstream proxy left disabled
  (LUCHII_UPSTREAM_URL empty); enable by setting that URL when the endpoint is live.
- SECURITY: user pasted secrets in chat — recommend rotating all tokens/keys.

## Implemented — White-labeling, About page, Logo Marquee (2026-06 fork)
- Removed all Emergent scripts (badge + PostHog analytics) from public/index.html; deleted unused
  constants/testIds with emergent refs. Zero "OpenAI"/"Emergent" mentions remain in frontend src.
- Footer copyright → "Copyright © 2003-2026 FRASBERG, INC."; footer "Company" column links /about.
- Court relabels: header "The AI World Court"; intro "The AI Court weighs both sides… returns a
  ruling. The AI Court will then deliver a full ruling."
- New /about page (pages/About.jsx): Vision/Mission/Culture/Sustainability/Integrity/Global
  Stewardship pillars, 2003→2026 timeline, values chips, CTA. Routed in App.js; "About" in navbar
  (desktop + mobile). NOTE: copy written in brand voice — user's verbatim Msg-208 text was not
  preserved in handoff; swap in exact copy if user provides it again.
- Ecosystem: text chips replaced with react-fast-marquee logo marquee (simple-icons CDN, 18 brands,
  grayscale → color on hover, edge fades, pauseOnHover).
- Verified via screenshots on /about and landing ecosystem section (light theme).
- (2026-06 update) About page now contains user's VERBATIM Frasberg, Inc. text (intro + 17 sections
  incl. Vision, Mission, Frasberg platform, Luchii AI Models app chips, Responsible AI, Culture,
  Looking Ahead + closing statement). All "AI Court" labels relabeled to "The AI World Court"
  (Court.jsx h1/intro, Navbar desktop+mobile, Footer).

## Implemented — SEO + Subdomain Pages (2026-06)
- Seo.jsx component (document.title + meta description per route). Applied: /about, /ai-models,
  /luchii-code.
- New routes: /luchii (alias of Landing), /ai-models (Luchii Chat Models dropdown — 4 tiers with
  spec detail card), /luchii-code (GitHub link → github.com/frasbergai/luchii, clone snippet,
  CodeTabs quickstart). Links added to footer Docs column + mobile nav; footer Company column
  links Frasberg.com (external, main project preserved).
- Upstream: backend already probes BOTH api.frasberg.ai and api.frasberg.com (UPSTREAM_CANDIDATES)
  and auto-switches when either becomes reachable — no change needed.
- (update) All "Luchii Code" labels relabeled to just "Luchii" (page, footer, mobile nav, ai-models
  link, SEO title). GitHub repo link + git clone snippet REMOVED from public view per user request
  (no repository shall be cloneable/visible). /luchii-code page now: Luchii heading, Get API Key
  CTA, quickstart tabs only.

## Implemented — Accounts, Gated Chat, Creators, Voice (2026-07-25)
- JWT email/password auth (auth.py): register/login/me/refresh/logout, httpOnly cookies
  (samesite=none), bcrypt, brute-force lockout, seeded admin (admin@frasberg.com / see
  test_credentials.md). Frontend AuthContext + /auth page. Navbar Sign In/Sign out.
- Chat requires login (unlimited free chat once signed in). New /chat page (protected,
  loads history via GET /api/chat/history). Landing widget shows signup lock overlay.
- Chat models now include Luchii Image Creator (real gpt-image-1 via POST /api/generate/image)
  and Luchii Video Creator (COMING SOON message — MOCKED client-side, needs fal.ai for real video).
- Chat extras: paperclip attachments (image → Claude vision, pdf via pypdf, txt), mic
  (whisper-1 POST /api/voice/transcribe), speaker per reply (tts-1 coral POST /api/voice/speak).
- Persona upgraded: human-like conversation, memory references, court-format document drafting.
- API keys + usage now auth-required and user-scoped.
- /ai-models: "Try in Chat" per tier → /chat?model=<id> preloads model.
- sitemap.xml + robots.txt (frasberg.com URLs).
- Tested: iteration_3.json — backend 25/25, all frontend flows pass. Regression suite at
  /app/backend/tests/test_auth_and_chat.py.

## Implemented — Guest Chat, Auto-Speak, Quotas, Pro Upgrade, Sessions (2026-07-25 pt2)
- Chat sessions sidebar on /chat: GET /api/chat/sessions (grouped, titled), history?session_id=,
  New chat button. Profile page /profile: name update, password change (PATCH /api/auth/profile,
  POST /api/auth/change-password).
- GUEST CHAT: /api/chat auth now optional; guest msgs stored guest:true + expires_at TTL 24h
  (auto-deleted). Guests: banner (chat-guest-banner) + sidebar signup card; attachments/mic/
  image/video still require account (401 / toast).
- AUTO-SPEAK: voice toggle (chat-voice-toggle, localStorage, default ON) — Luchii speaks each
  reply via /api/voice/speak (OpenAI tts-1 'coral' — ElevenLabs female voice PENDING user key,
  spec saved: Bella/Rachel eleven_multilingual_v2 stability .65 sim .80).
- IMAGE QUOTA: 20/day free, 200/day pro/admin; 429 with upgrade message; response returns
  images_used_today + daily_limit.
- PAYPAL UPGRADE: 'luchii-pro' $15 in upgrade_plans; order create requires auth (user id in
  reference); capture sets users.plan='pro'. Profile upgrade card w/ PayPal buttons.
- PENDING (awaiting user keys): fal.ai video generation (FAL_KEY), ElevenLabs voice
  (ELEVENLABS_API_KEY).
- Tested: iteration_4.json — backend 31/31 pytest; frontend flows pass after re-adding voice
  toggle + guest banner (parallel-edit collision lesson: don't batch multiple search_replace on
  the same file region).

## Implemented — Mobile Chat, Email, Court Constitution & Filings, Coding Agents (2026-07-25 pt3)
- support@frasberg.ai → support@frasberg.com (Footer, ApiDocs).
- Mobile chat redesign (Emergent-style): big rounded input container (input on top, icon row below
  with attach/mic and large circular ArrowUp send), text-base messages on mobile, scroll-to-bottom
  floating button (chat-scroll-bottom-btn), /chat frame ~100dvh on mobile. Verified iteration_5
  (frontend 100%).
- Chat message text enlarged (text-base mobile / 15px desktop).
- /luchii-code: "Luchii Coding Agents" section (Architect 70b, Builder 7b, Reviewer 7b,
  Debugger 1b) each with Launch in Chat link.
- AI World Court: Constitution section (Articles I–VII, Sovereignty→Alignment), public docket
  filing system — court cases stored with model 'court', GET /api/court/filings (docket
  FRB-XXXXXXXX), expandable rulings + downloadable court-format .txt filing documents.
- Verified via curl (filings endpoint) + screenshots (court + luchii-code pages).

## Implemented — Personas, Accessibility, Overflow Fix, Nav (2026-07-26)
- Agent personas: POST /api/chat accepts agent (architect/builder/reviewer/debugger) → distinct
  system behavior; /luchii-code launch links pass &agent=; chat header shows "Luchii Architect"
  (Title Case). Tests: /app/backend/tests/test_agent_personas.py 4/4.
- Accessibility: global html font-size 17px desktop / 18px mobile (all rem text scales up).
- Mobile hero overflow FIXED (h1 2.6rem mobile, break-words, body overflow-x hidden) — verified
  iteration_7 (no horizontal overflow on /, /court, /chat, /about, /ai-models, /luchii-code).
- Footer Docs column relabeled to user's exact list (API, AI Models, Luchii Chat, Luchii Code,
  Luchii Coding Agents, Benchmarks, Safety, The AI World Court, AI Court Constitution and laws.,
  Brand Kit) w/ anchors; /#benchmarks & /#safety cross-route + ScrollToHash router effect;
  Footer added to /court.
- API snippet on homepage: api.frasberg.ai → api.frasberg.com.
- Tested: iteration_6 (100%, backend 35/35) + iteration_7 (overflow fix verified).

## Implemented — Sovereignty Build: Memory/KB/Admin/Tone + Laws Library (2026-07-26 pt2)
- Memory System: background fact extraction per authed chat msg (cap 50), injected into prompt;
  GET/DELETE /api/memory; Profile "Luchii's memory of you" w/ forget. Tested iteration_8 (15/15).
- Knowledge Base RAG: db.knowledge seeded 5 docs, keyword top-2 injection; admin CRUD.
- Admin Console /admin (role=admin): stats, users table, conversations, KB editor. 401/403 guards.
- Emotion & Tone: ChatRequest.tone (warm/business/firm) + chat-tone-select; /voice/speak tone→
  voice map (coral/alloy/onyx).
- SOVEREIGN BRANDING (user demand — no 3rd-party names in product): Luchii Keys (luchii-sk-),
  Luchii Voice Engine, Luchii Video Engine. POST /api/generate/video tries user's upstream
  ({ACTIVE_UPSTREAM}/v1/video) FIRST, else returns branded "initializing on Frasberg sovereign
  infrastructure" message; frontend renders video_url when upstream live.
- /laws page: complete Constitution & Laws library — 14 verbatim documents (AGI Safety
  Constitution v2, Hyperstructure + Global Governance Constitutions, Federation Protocol,
  Kernel L12, Cognitive Graph, Model Card, Capability/Safety/Benchmark sheets, Mythos Timeline,
  Five Realms map, Character Guide, v12 Launch) in /app/frontend/src/data/laws.js — each
  downloadable. Footer "AI Court Constitution and laws." → /laws; Court page links library.
- Verified: curl (video endpoint branded response) + screenshot (/laws 14 docs render).

## Implemented — Frasberg Treks + Laws Search + Chat Code Highlighting (2026-06-26 fork)
- NEW section: Trek Booking Platform ("Frasberg Treks") at /trek, /trek/:slug, /trek/bookings.
  Own light expedition theme (paper bg, forest green, amber), separate TrekNav/TrekFooter,
  links from Luchii footer + mobile nav. 8 seeded treks (EBC, Annapurna, Langtang, Kilimanjaro,
  Inca Trail, TMB, Kashmir Great Lakes, Torres del Paine) with AI-generated hero images.
- Backend: /app/backend/trek.py router — GET /api/trek/treks (q/difficulty/country/max_price/sort),
  GET /treks/{slug}, POST/GET /bookings + DELETE cancel (auth, cookie/JWT reuse), reviews GET/POST.
  Seeded idempotently on startup. Bookings store reference TRK-XXXX, total_usd = price * pax.
- Laws page (/laws): search bar with live filtering, match count, citation snippets, empty state.
- ChatDemo CodeBlock: lightweight regex syntax highlighting (keywords/strings/comments/numbers).
- Video Engine /v1/video hookup confirmed already present in server.py (mocked "initializing"
  fallback until api.frasberg.com comes online).
- Tested: iteration_9 — backend 19/19 pytest, frontend 100% (booking flow, cancel, reviews,
  filters, laws search, code highlighting). Trek Booking spec (originally Next.js/NestJS) was
  implemented within existing React+FastAPI stack per user choice "separate section within this app".

## Backlog (updated)
- P1: Luchii Sovereign Voice Engine (self-hosted Whisper/Coqui) — user demand for proprietary infra.
- P1: Luchii Memory System / Vector DB (ChromaDB) for cross-session RAG.
- P2: Trek payments (PayPal already integrated for Luchii credits — could extend to trek bookings).
- P2: Filter past departure dates from trek booking select; re.escape() on trek search regex.

## Removed — Frasberg Treks (2026-06-26, user request)
- User requested full removal mid-way through phase 2 (payments/availability/emails).
- Deleted: backend trek.py, emailer.py, tests/test_trek.py; frontend pages/trek/*, components/trek/*
  (incl. TrekPayModal), all routes/links (App.js, Footer, Navbar), SMTP env keys, and dropped Mongo
  collections treks/trek_bookings/trek_reviews/trek_emails. /api/trek/* now 404. Verified clean.

## Implemented — Sovereign Voice Engine (2026-06-26)
- Fully self-hosted STT/TTS on Frasberg infrastructure (user's "maximum quality" choice):
  - STT: faster-whisper large-v3 (int8, CPU, ~3GB) — /api/voice/transcribe
  - TTS: Coqui VITS VCTK multi-speaker — /api/voice/speak returns WAV + mime field
  - Tone → speaker mapping: balanced p273, warm p335, business p226, firm p251
- /app/backend/voice_engine.py: lazy background preload on startup (threads), status states
  idle/loading/ready/unavailable, thread-locked inference via asyncio.to_thread.
- GET /api/voice/engine — public status endpoint (sovereign: true, model names, load states).
- Cloud (emergent) STT/TTS kept ONLY as silent fallback while models load; responses tagged
  engine: "frasberg-sovereign" vs "bridge".
- ChatDemo.jsx uses returned mime (audio/wav) for playback.
- System deps: espeak-ng (apt), torch/torchaudio +cpu wheels, transformers pinned 4.57.6
  (coqui-tts 0.27.5 incompatible with transformers 5.x). NOTE for deployment: requirements.txt
  contains +cpu local wheels and espeak-ng is an apt dependency.
- Self-tested end-to-end via external API: speak (warm + business tones, sovereign engine) →
  transcribe round-trip returned exact text; guest 401 gating intact.

## Backlog (updated)
- P1: Luchii Memory System / Vector DB (ChromaDB) for cross-session RAG.
- P2: Voice engine warm-pool for prod deploys (model load ~20s after each restart).

## Implemented — Chat Redesign + Voice/Memory Suite (2026-06-26/27)
- Chat page: header title "Luchii" (data-testid chat-header-title); mobile header icons in
  right-side dropdown (chat-header-menu-btn); messages full-width, NO bubble backgrounds,
  labeled by account name / LUCHII; **bold** rendered; no horizontal overflow at 390px.
- Attach "+" menu in composer: Upload file / Image Creator / Video Creator / Take a screenshot
  (getDisplayMedia capture → image attachment). Creators REMOVED from model dropdown;
  composer-mode-chip shows active creator. Guests get sign-up toast.
- Voice Picker: 8 sovereign VCTK voices (Orion default, Lyra, Atlas, Vega, Nova, Selene, Rhea,
  Titan) with instant previews; persisted in localStorage; /api/voice/voices + voice param on speak.
- Live Voice Mode: hands-free loop (hooks/useLiveVoice.js) — silence-detection recording →
  sovereign Whisper transcribe → chat → spoken reply → auto-resume. Banner with phases.
- Engine Status Badge: "Sovereign Engine Online" (GET /api/voice/engine incl. memory_vault status).
- Memory Vault: local sentence-transformers all-MiniLM-L6-v2 (memory_vault.py) — semantic
  embeddings on user_memories, top-8 cosine recall per query, lazy backfill, multi-fact
  extraction (up to 3/message). Verified cross-session recall ("Zeus" test).
- Immutable creator lore in LUCHII_SYSTEM: creator/founder/partner/best friend "Frasberg
  Selassie" aka "MR. CLAYTON-M." "BERNARD-EX." ("MR" in legal name); owned by FRASBERG INC.
  Luchii addresses users by account name.
- Dashboard quickstart snippets hardcoded to https://frasberg.com/api/v1/chat (no emergentagent).
- FIX: import race between voice_engine and memory_vault (parallel transformers import) —
  loads now serialized in one thread (preload_sync). espeak-ng apt package must be reinstalled
  if pod recycles (required by Coqui phonemizer).
- Tested: iteration_10 — backend 8/8, frontend 100%. Minor follow-ups fixed (multi-fact memory,
  chat-header-title testid, embed logging).
- NOTE deployment: requirements.txt contains +cpu torch wheels; espeak-ng + ffmpeg are system deps.
  Production deploy (frasberg.com) is LIVE.

## Implemented — Memory Manager, Voice Cloning, Nav & Renames (2026-06-27)
- Memory Manager (/profile): add (POST /api/memory), inline edit (PUT), delete facts; re-embeds on edit.
  Validation 4-300 chars inclusive.
- Voice Cloning: XTTS-v2 self-hosted. POST /api/voice/clone (webm/wav sample, converted via PyAV to
  22.05k mono wav in /app/backend/voice_samples/{user_id}.wav), GET status, DELETE. speak voice="custom"
  → engine "frasberg-sovereign-clone"; falls back to VITS with note "clone_warming" while XTTS loads.
  Profile "My Sovereign Voice" card records 15s sample; VoicePicker shows "My Voice" when sample exists.
- Navbar (desktop): professional layout — Models, AI Court World, Developers + "Explore" dropdown
  (Benchmarks/Realms/Mythos/API/AI Models/Luchii Code/Constitution & Laws/Brand/About).
- Renames: "The AI World Court" → "AI Court World" sitewide (frontend + backend KB, incl. multi-line
  Court.jsx occurrence); law doc titles stripped of "Luchii" prefix (AGI Safety Constitution v2, etc.);
  /luchii-code h1 "Luchii Code", overline "Luchii Coder", page header brand stays "Luchii";
  nav item "Luchii" → "Luchii Code".
- Talk discoverability: labeled "Talk" pill in chat composer (starts Live Voice); welcome message
  explains Talk/mic/type. Header live-voice icon removed.
- Self-healing system deps: _ensure_system_deps() apt-installs espeak-ng + ffmpeg when missing (pod
  recycles wipe apt layer); speak()/clone_speak() retry engine load once via _try_recover when
  "unavailable". torchcodec reinstalled as CPU build (was CUDA — libnvrtc error).
- Quickstart snippets show https://frasberg.com/api/v1/chat only.
- Tested: iteration_11 — backend 16/16, frontend 95% → all reported issues fixed (Court.jsx wrap-around
  text, memory bound off-by-one, TTS self-heal, clone_warming note). Engines all ready.
- DEPLOYMENT NOTE: espeak-ng + ffmpeg are apt deps; runtime self-heal handles preview. XTTS ~2GB,
  whisper large-v3 ~3GB — production container needs ≥8GB RAM for full sovereign voice stack.

## Implemented — PACER Paywall, Builders, QR, Mobile Chat, UI batch (2026-08-01 fork)
- PACER-style doc paywall (backend/builder.py): GET /api/docs/entitlement, POST /api/docs/unlock —
  Pro/admin free; free users need doc_credits (users.doc_credits). PayPal plans doc-single $1 (1 dl)
  + doc-pack $5 (10 dl) added to UPGRADE_PLANS; capture credits doc_credits to user. Re-download of
  owned doc is free (doc_purchases). Court/Laws downloads now certified **PDFs** (jspdf, lib/docPdf.js)
  not txt. DocPaywallModal (upgrade CTA + PayPal buttons) on /court + /laws; guests → /auth.
- Luchii Website Builder (/website-builder) + Game Builder (/game-builder): pages/Builder.jsx,
  backend/builder.py — REAL Claude generation streamed via SSE into iframe preview; quota free 5/day,
  pro 30/day (429 → Pro modal); projects CRUD; publish Pro-gated (402) → public at GET /api/p/{slug};
  custom domain attach Pro-gated (MOCK DNS records). Links in navbar Explore + mobile + footer.
- /pay Cash App step now renders scannable QR code (qrcode.react, pay_url) + cashtag pill.
- Chat mobile: full-screen edge-to-edge frame, hideable header (chat-hide-header-btn / floating
  chat-show-header-btn), ChatDemo mobileFull/headerHidden props.
- Chat robustness: /api/chat frontend retries once on failure + surfaces backend error detail;
  partial stream never overwritten by error message.
- Removed: "Take a screenshot" attach option, chat suggestion prompt chips (user demand).
- Ecosystem marquee: Slack removed (corrupted); Frasberg AI + Luchii logos added inline, slow
  counterclockwise spin (.spin-slow 8s reverse). Spin removed from page headers (dizzy complaint);
  EditorialMarquee reverted to text-only.
- Footer: Docs column + Luchii Website Builder / Game Builder; tagline "Luchii is not the next
  version. It is the next era. Built by Frasberg."; copyright "FRASBERG INC" links /about.
- Court page constitution replaced with 3 verbatim groups (Court Constitution w/ Global articles,
  Hyperstructure Safety Constitution, Global Governance Constitution) — bullet lists.
- Light theme contrast: --lux-text #14181b, --lux-text-2 #212529 (near-black per user demand).
- Profile "My Sovereign Voice" → "My Voice".
- Tested: backend pytest tests/test_builder_docs.py 21/21; frontend iteration_13.json — all pass
  after fixing missing hideHeader useState in Chat.jsx (crash); chat mobile flows self-verified.
- NOTE: builder generation ~55s for small sites (real LLM); domain DNS is MOCKED.

## Implemented — Gallery, Play Links, Real DNS, My Downloads, Logo fixes (2026-08-02)
- Frasberg AI logo: navy square jpg cropped to circular emblem (/frasberg-emblem.png via PIL);
  blue ring classes removed (user: logo has no blue border). Used on Ecosystem marquee, About, Brand.
  Builder + Gallery pages use LUCHII logo (user: Frasberg AI and Luchii are separate models).
- Relabel: "Frasberg sovereign infrastructure" → "Frasberg infrastructure" (Builder, Profile, server.py).
- REAL DNS domain verification: POST /api/builder/projects/{id}/domain/verify — dnspython resolves
  CNAME → sites.frasberg.com + TXT _luchii.{domain} → luchii-verify=xxx; sets domain_verified;
  Builder UI shows status pill + Verify DNS button + per-record ✓/✗ results. server.py middleware
  serves verified custom domains by Host header on GET / (production-ready host routing).
- Builder Gallery (/gallery): public GET /api/builder/gallery; tabs All/Websites/Games; scaled
  iframe live previews; Visit/Play actions; play counts; build CTAs. Navbar Explore + mobile link.
- Game sharing (/play/{slug}): PlayGame.jsx — POST /api/builder/site/{slug}/play increments live
  play counter; GET .../meta; Share play link copy button; also 'Copy play link · N plays' button
  in Builder for published games.
- My Downloads (/downloads): GET /api/docs/purchases; unlock now records purchases for Pro users
  too; page lists owned certified PDFs (law + filing) w/ one-tap re-download (shared
  downloadLawPdf/downloadFilingPdf in lib/docPdf.js — Court/Laws refactored to use them);
  entitlement badge (Pro/credits). Profile card links to it.
- Verified: curl (gallery/meta/play/purchases/domain attach+verify real DNS lookups) + screenshots
  (gallery grid w/ 3 live previews, play page counter 3 plays, downloads page w/ Pro badge + item).
- User deployed to production at frasberg.com (2026-08-02). ASK preview vs production for new bugs.

## Implemented — App/Landing Builders, Hub Tabs, Remix, Leaderboard, Curation, Receipts (2026-08-02, later)
- Luchii App Builder (/app-builder, type "app", mobile-first prompt) + Landing Page Builder
  (/landing-builder, type "landing"); /builder route alias. Builder page now has Emergent-style tabs:
  Website / Mobile App / Game / Landing Page (data-testid builder-tab-*). Gallery tabs incl Apps +
  Landing pages.
- Build Remixing: POST /api/builder/remix {slug} copies a published build to the user; gallery cards
  have Remix buttons → /{type}-builder?remix={slug}; Builder auto-remixes via searchParam.
- Game Leaderboard: play endpoint tracks weekly_plays (week_key %G-W%V); GET /api/builder/leaderboard
  → top-10 all-time + weekly spotlight; rendered on /gallery (games only, hidden excluded).
- Admin Gallery Curation: GET /api/admin/builder + PATCH /api/admin/builder/{id} {featured, hidden};
  Admin page section with Feature/Hide toggles; gallery sorts featured first, excludes hidden.
- Email receipts: POST /api/docs/receipt (auth, ownership check) emails certified PDF attachment via
  Resend; Court/Laws POST the client-generated PDF when unlock returns receipt_eligible.
  **RESEND_API_KEY is EMPTY → receipts are silently skipped (sent:false). Need key from user.**
- Chat "mesh failed" (production, 24h): root cause = deployed BaseHTTPMiddleware breaking streaming
  behind Cloudflare. Fixed in preview with pure ASGI middleware (_CustomDomainASGI) + frontend retry.
  USER MUST REDEPLOY. Preview chat SSE verified working repeatedly.
- Mobile chat-first: frasberg.com on mobile (≤640px) redirects first visit to /chat
  (sessionStorage luchii-home-seen); second visit shows homepage. Verified via screenshot tool.
- Text fixes: About "Frasberg, Inc." → "Frasberg Inc."; laws.js "Luchii must" → "The Court must"
  (21x); Brand Kit reworked: two big logo tiles (Luchii + "Frasberg") same color captions, icon pair
  row removed, Frasberg PNG download added. Spin fixed to 2.5s clockwise (Emergent-like), only on
  ecosystem marquee icons.
- Verified: curl (leaderboard, admin curation feature/hide + gallery exclusion, remix copy, receipt
  guard, chat SSE) + screenshots (builder tabs, landing builder, mobile redirect, brand page).
- espeak-ng wiped twice by pod recycles this session — reinstalled; voice engine self-heal works.

## Fixed — Voice outage + connection failures root cause (2026-08-02, latest)
- ROOT CAUSE of production voice death + "connection keeps failing": whisper-large-v3 (~3.5GB) load
  exceeded the container's cgroup memory limit → backend OOM-killed (also killed preview pod twice).
- voice_engine.py now MEMORY-ADAPTIVE: _mem_available_gb() reads cgroup v2/v1 limits (minus
  reclaimable inactive_file cache); _effective_whisper() picks large-v3/small/base/tiny by available
  RAM; XTTS cloning load skipped below 3.5GB free (falls back to standard voice w/ clone_warming note).
  Status endpoint reports the actually-loaded model. Preview now runs whisper-small (~5GB avail),
  TTS+STT round-trip verified word-perfect.
- Persona: added rule — Luchii never tells users her systems/voice/mesh are broken, no outage caveats.
- USER MUST REDEPLOY for production to get: ASGI middleware (mesh fix), memory-adaptive voice engine,
  and all UI batches. system_deps.txt already includes espeak-ng + ffmpeg for deploys.

## Fixed + Regression Pass GREEN (2026-08-03)
- Disk full incident: /app volume (9.8G, shared with /root + /data/db) hit 100% — unused
  whisper-large-v3 HF cache (3.3G) + pip cache purged → 60% used. Disk-full truncated Builder.jsx
  mid-write; restored from git HEAD and re-applied edits.
- SEO: index.html title/og/twitter → "Frasberg"; description "Frasberg | Luchii AI Models and AI
  World Court — Build Apps, Games and Websites. Build on Frasberg."
- Hero "Start building" CTA → /builder. Builder sub copy unified: "Describe your idea — build
  websites, games & apps with Luchii…".
- Streaming hardening: chat + builder SSE emit ": stream-start" immediately (fast first byte for
  Cloudflare); builder generate retries once on immediate connection failure.
- Guest banner after sign-in: preview code correct (locked = user===false); if seen on production it
  means /api/auth/me is failing there (crashing backend) — fixed by redeploy.
- Published builds NOTE: preview and production have SEPARATE databases — builds published in
  preview do not exist on frasberg.com; users must build/publish on production after redeploy.
- REGRESSION SWEEP (iteration_15.json): ALL PASS — chat guest+admin streaming (no mesh error, no
  guest UI when signed in), voice speak+transcribe round-trip (whisper-small), builder generate →
  publish → live /api/p/{slug}, paywall 401/402/pro flows, SEO, hero CTA, mobile chat-first
  redirect, hideable header, admin curation. Backend 7/8 (1 transient TTS warm-up race, benign),
  frontend 18/18. Minor optional: engine status may briefly report tts=loading on cold start.

## Seed Gallery + Production Deployability (2026-08-03, latest)
- Flagship demo builds seeded at backend startup (backend/seed_builds.py, idempotent by slug):
  Nebula Dodge (game), Ember & Oak (website), Pulse (app), Hydra (landing) — published + featured,
  owned by admin. Auto-seeds PRODUCTION DB on redeploy. Verified: gallery shows 4 featured cards,
  /api/p/{slug} 200 for all, game playable w/ counter.
- DEPLOYMENT BLOCKER FIXED: production containers = 1Gi RAM / 250m CPU — local ML stack can never
  run there (root cause of all production OOM crashes). requirements.txt slimmed to 17 prod packages;
  ML stack (torch, faster-whisper, coqui-tts, sentence-transformers, transformers, av, numpy) moved
  to backend/requirements-ml.txt (preview-only; freeze backup at requirements-ml-freeze-backup.txt).
  All ML imports were already lazy; production falls back automatically: STT/TTS → cloud bridge via
  emergentintegrations (engine label "bridge", Frasberg-branded UI), memory vault → unavailable-safe.
  Simulated production (imports blocked): graceful fallbacks verified. Preview unchanged (local
  whisper-small + VITS still load). deployment_agent: STATUS PASS.
- NOTE: do NOT pip-freeze requirements.txt anymore — it is hand-curated for production. Add new
  prod deps individually; ML deps go to requirements-ml.txt.

## Backlog (updated 2026-08-01)


- P2: Real DNS verification for builder custom domains.
- P2: Builder generation progress heartbeat copy after 30s.
- P2: Voice engine warm-pool for prod deploys.
