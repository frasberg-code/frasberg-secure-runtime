# LuchiiMobile — Sovereign Native Client

React Native (Expo) client for the Luchii Mesh with libsodium end-to-end
device encryption. No third-party analytics, no external SDKs — everything
talks directly to your self-hosted Frasberg stack.

## Security model
- **libsodium secretbox**: chat history is encrypted at rest on the device
  with a per-device XSalsa20-Poly1305 key generated on first launch.
- **Sealed box channel** (`sealForServer`): payloads can be sealed to the
  mesh server's public key for true in-transit E2E once the mesh advertises
  its `crypto_kx` public key.
- **Mesh verification**: every assistant reply signature is round-tripped
  through `POST /api/mesh/verify` — verified replies render the
  "✓ MESH VERIFIED" shield, same as the web client.

## Run it
```bash
cd mobile/LuchiiMobile
yarn install
EXPO_PUBLIC_BACKEND_URL=https://frasberg.com yarn start
```

For local mesh development:
```bash
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.50:8001 \
EXPO_PUBLIC_MESH_WS_URL=ws://192.168.1.50:8002 yarn start
```

## Structure
```
App.js                      # navigation shell (Login → Chat)
src/config.js               # backend + mesh WS endpoints (env-driven)
src/crypto/e2e.js           # libsodium: secretbox, sealed box, kx keypair
src/api/client.js           # auth + mesh signature verification
src/api/mesh.js             # /ws/mesh WebSocket client w/ auto-reconnect
src/screens/LoginScreen.js
src/screens/ChatScreen.js   # streaming tokens, verified shield, enc. history
```
