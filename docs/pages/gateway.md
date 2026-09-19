# Gateway

The gateway provides health, auth, OpenAI-compatible routing, queued job access, and Frasberg backend wrappers.

## Frasberg backend routes

- `POST /api/music`
- `POST /api/video`
- `POST /api/stt`
- `POST /api/tts`
- `POST /api/audio`
- `GET /api/jobs/:id`

All Frasberg calls are backend-to-backend only and use environment-provided bearer keys.

## Gateway-server trust boundary

- `apps/gateway-server` verifies JWT signature, expiry, issuer, and audience.
- Admin authorization is based on a server-side role lookup keyed by `sub`; it does not trust a client-provided JWT `role` claim.
- The in-memory engine adapter is for local/test use only. Real music/video/image/voice/STT/TTS backends must be deployed and configured separately.
