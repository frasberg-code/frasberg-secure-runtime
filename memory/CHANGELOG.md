
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
