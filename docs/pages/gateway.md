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
