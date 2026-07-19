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
