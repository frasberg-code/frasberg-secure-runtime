
## June 2026 - Text Updates
- Dashboard header: "Luchii Developer Console" -> "Frasberg Developer Console" (Dashboard.jsx)
- Navbar + Footer: "Frasberg Games" -> "Games"; Footer: "Softwares" -> "Software"

## June 2026 - Feature batch (iteration 34)
- Footer: "Code" -> "Luchii Code"; AI Coding Agents now has its own page /coding-agents (CodingAgents.jsx); LuchiiCode.jsx keeps a teaser link
- Dashboard header: Frasberg logo (frasberg-mark-circle.png) + "Frasberg Developer Console"
- Plan Upgrades: quota chip on /dashboard is clickable -> UpgradePlanModal (Free/Pro/Scale) with PayPal; backend UPGRADE_PLANS api-pro ($12.50/mo, plan=pro) + api-scale ($50/mo, plan=scale); PAID_PLANS includes scale
- Instant free API key (ElevenLabs-style): GET /api/keys auto-creates "Free Starter Key" (2500 credits) for users with zero keys, idempotent
- Admin Tenant Analytics: GET /api/admin/tenants/analytics (top 6 tenants, 14-day token trend) + line chart panel on /admin (tenant-analytics-panel)
- Game voice API: GET /api/games/voice?text&sex -> cached mp3 via OpenAI TTS (Emergent key), rate-limited, whitelisted chars; db.game_voice_cache
- Street Vybz overhaul: palm trees replaced with urban props (hydrants, traffic lights, bus shelters, street signs); walk/run speeds humanized (3.4/7 m/s) with acceleration + stride timeScale sync (no foot skipping); melee reworked (wind-up -> strike -> follow-through, spine rotation, delayed hit resolution, thwack/whoosh/grunt WebAudio); NPCs fall with tween instead of snapping flat (knockDown helper); proper pistol/bat models + muzzle flash cone/light; env.js speechSynthesis robot voice REMOVED -> server TTS with client cache
- Testing: iteration_34.json — backend issue (Free Starter Key edit lost in file corruption) re-applied and curl-verified; frontend 100% pass
- NOTE: server.py had a corrupted duplicate tail after parallel edits (unmatched paren line ~2843) — removed; watch for this on large parallel search_replace batches

## June 2026 - Frasberg Cloud V1 (iteration 35 — 100% pass backend + frontend)
- New backend module /app/backend/frasberg_cloud.py (router /api/cloud) implementing ALL user-spec engines pragmatically:
  Genesis, agent Psychology/Soul/Reputation/Education/Ascension/Dreams/Reincarnation, Eternal-Cycle phases,
  Collapse Recovery, Paradox Resolver, Predictive Safety (posture/audit/evolution-freeze), Hyper-Stability,
  Singularity Birth, Civilizations, Mythology, Dimensional + Fractal Expansion, Migration, Trade,
  Omni-Synthesis (universe fusion), Diplomatic Congress (resolutions + probabilistic voting),
  Kernel Omni-Intelligence status + 5 Absolute Laws
- Collections: cloud_universes, cloud_events, cloud_congress. Caps: 50 universes, 60 agents each, 25 ticks/call
- New console page /cloud (FrasbergCloud.jsx): kernel status bar, genesis form, universe cards w/ tick buttons,
  detail modal (entropy/stability charts, agents, civs, myths, event stream), multiverse ops bar
  (synthesis/migrate/trade on 2 selected), congress panel, absolute laws panel. Footer link footer-cloud-link
- Endpoints are public (no auth). Simulation is stochastic
- Known cosmetic: Recharts -1 width warning on detail modal first mount (optional fix)

## June 2026 - Cloud Auto-Run + Phase 2 (self-tested: curl + local sim + screenshot)
- Auto-Run Mode: global toggle on /cloud (data-testid auto-run-toggle) ticks every universe each 5s; quiet mode only toasts important events (war/era/singularity/collapse/ascension/exchange)
- Civilization wars: 12% chance/tick when 2+ civs and tension >= -0.1; loser loses pop/tech, winner gains warsWon/military, entropy +0.02 (verified 6 wars in 80-tick local sim)
- Tech trees/eras: Primitive->Agrarian->Industrial->Digital->Fusion->Quantum->Transcendent from technologyLevel; era advance boosts expansion+military, logged as 'era' events
- Cultural exchange: POST /api/cloud/exchange {a,b} — civs share rituals/symbols, cooperation boost, myth crosses universes, +50 knowledge each; ops-exchange-btn in multiverse ops bar
- Detail modal shows civ era chip, wars won, rituals

## June 2026 - Multiverse Star-Map (self-tested: curl + screenshot + node-click)
- db.cloud_links collection: _link() upserts on trade/exchange/migrate; GET /api/cloud/map returns universes + filtered links
- MultiverseMap SVG component on /cloud: deterministic hash-positioned glowing nodes (size ~ log pop, color by phase), animated dashed routes colored by kind (trade cyan, exchange gold, migration violet) with count labels, node click opens detail modal, legend + empty-state hint

## June 2026 - Universe Chronicle (self-tested: curl + screenshot)
- POST /api/cloud/universes/{id}/chronicle: gathers universe facts (phase, civs/eras/wars, myths, legendary agents, recent events) -> Claude Sonnet 4.6 via Emergent LLM key writes a <=420-word mythic history scroll in 3-4 chapters; cached in universe doc as chronicle{text,tick,created}; detail response includes it
- Detail modal: Chronicle panel (chronicle-panel) with Write/Rewrite button (write-chronicle-btn), italic scroll typography, "Inscribed at tick N" footer

## June 2026 - Chronicle Narration + Admin Universe Management (self-tested: curl + live UI both pages)
- GET /api/cloud/universes/{id}/chronicle/audio: chronicle text -> OpenAI tts-1 'onyx' via Emergent key -> mp3 (2.5MB verified), cached in db.cloud_narrations by text hash
- Chronicle panel: "Read aloud" button (narrate-chronicle-btn) with loading/playing/stop states; cleanup on modal close
- Admin console: "Frasberg Cloud — Universes" panel (admin-cloud-panel) with full universe table + Tick x10 / Dissolve actions + Open Cloud Console link; verified Tick advanced 22->32 live
- Created 3 permanent test universes per user request: Frasberg (standard), Luchii (quantum), LINQ Universe (exotic) — all ticked to 20, chronicled, linked via trade/exchange/migration on the star-map

## June 2026 - Emergent-style Dashboard + Universe Snapshots + LINQ rename (iteration 36 — frontend 100%)
- Dashboard.jsx FULL REWRITE per /app/design_guidelines.json: obsidian #08090A, sharp rounded-sm panels, JetBrains Mono metrics, cyan #00F0FF accent, 64px top nav, bento overview (requests/tokens/keys/wallet), quota progress bar + upgrade, usage chart w/ empty state, keys table rows, Playground/Quickstart/Models 2-col, email history, Pricing. All testids + functionality preserved
- Universe Snapshots: POST/GET /api/cloud/universes/{id}/snapshots (cap 10), POST /api/cloud/snapshots/{sid}/restore, DELETE; admin cloud table has Snapshot / Restore… (chips row) / Dissolve; restore verified tick 30->20
- 'LINQ Universe' renamed to 'LINQ' in db.cloud_universes
- Fixed long-standing hydration warning: ChatDemo.jsx voice-speed option now uses label attr (visual-editor span injection workaround)
