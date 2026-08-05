// ── Frasberg Carjack — Core WebSocket Server ───────────────────────────────────
'use strict';

import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createClient } from 'redis';
import jwt from 'jsonwebtoken';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import sodium from 'libsodium-wrappers';

// ── E2E encryption — server keypair ────────────────────────────────────────────
await sodium.ready;
const SERVER_KEYPAIR = sodium.crypto_box_keypair();
console.log('[Server] 🔐 Server keypair generated.');

const PORT       = process.env.PORT       || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'frasberg-dev-secret';
const REDIS_URL  = process.env.REDIS_URL  || 'redis://localhost:6379';

// ── Process crash protection ───────────────────────────────────────────────────
process.on('uncaughtException',  (err) => console.error('[Server] uncaughtException:', err.message));
process.on('unhandledRejection', (r)   => console.error('[Server] unhandledRejection:', r));

// ── Redis ──────────────────────────────────────────────────────────────────────
const redis = createClient({
  url: REDIS_URL,
  socket: { reconnectStrategy: (retries) => (retries > 3 ? false : 500) },
});
redis.on('error', (e) => { if (!redis._warned) { console.warn('[Redis]', e.message, '— running without Redis'); redis._warned = true; } });
redis.connect().then(() => console.log('[Redis] connected')).catch(() => {
  console.warn('[Redis] offline — buffering locally');
});

// ── Rate limiter ───────────────────────────────────────────────────────────────
const limiter = new RateLimiterMemory({ points: 60, duration: 1 });

// ── State ──────────────────────────────────────────────────────────────────────
const rooms   = new Map();   // roomId → Set<ws>
const clients = new Map();   // ws → { id, roomId, playerId, x, y, angle, speed }
let   metrics = { connections: 0, messages: 0, errors: 0, carjacks: 0, chases: 0, missions: 0 };

// ── HTTP Server ────────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok', connections: metrics.connections }));
  }
  if (req.url === '/metrics') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end([
      `frasberg_ws_connections_active ${metrics.connections}`,
      `frasberg_messages_total ${metrics.messages}`,
      `frasberg_ws_errors_total ${metrics.errors}`,
      `frasberg_carjacks_total ${metrics.carjacks}`,
      `frasberg_active_police_chases ${metrics.chases}`,
      `frasberg_active_missions ${metrics.missions}`,
    ].join('\n'));
  }
  res.writeHead(404);
  res.end();
});

// ── WebSocket Server ───────────────────────────────────────────────────────────
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

  // Rate limit
  limiter.consume(ip).catch(() => {
    ws.close(1008, 'Rate limit exceeded');
    return;
  });

  metrics.connections++;
  const clientData = { id: generateId(), roomId: null, playerId: null, x: 0, y: 0, angle: 0, speed: 0, sharedSecret: null };
  clients.set(ws, clientData);

  console.log(`[WS] Client connected: ${clientData.id} (${ip}) — total: ${metrics.connections}`);

  // Heartbeat
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', (raw) => {
    metrics.messages++;
    try {
      let msg = JSON.parse(raw);
      if (msg.__enc && clientData.sharedSecret) {
        msg = decryptEnvelope(msg, clientData.sharedSecret);
        if (!msg) return;
      }
      handleMessage(ws, msg, clientData);
    } catch (e) {
      metrics.errors++;
      send(ws, { type: 'error', message: 'Invalid JSON' });
    }
  });

  ws.on('close', () => {
    metrics.connections--;
    cleanup(ws, clientData);
    console.log(`[WS] Client disconnected: ${clientData.id} — total: ${metrics.connections}`);
  });

  ws.on('error', (e) => {
    metrics.errors++;
    console.error(`[WS] Error for ${clientData.id}:`, e.message);
  });

  send(ws, {
    type: 'welcome',
    id: clientData.id,
    serverTime: Date.now(),
    serverPublicKey: sodium.to_base64(SERVER_KEYPAIR.publicKey),
  });
});

// ── Message Handler ────────────────────────────────────────────────────────────
function handleMessage(ws, msg, client) {
  switch (msg.type) {

    // ── E2E Key Exchange ──
    case 'key_exchange': {
      try {
        const clientPublicKey = sodium.from_base64(msg.publicKey);
        client.sharedSecret = sodium.crypto_box_beforenm(clientPublicKey, SERVER_KEYPAIR.privateKey);
        console.log(`[Server] 🔐 E2E established with client ${client.id}`);
        send(ws, {
          type: 'key_exchange_ack',
          serverPublicKey: sodium.to_base64(SERVER_KEYPAIR.publicKey),
        });
      } catch (e) {
        metrics.errors++;
        send(ws, { type: 'error', message: 'Key exchange failed' });
      }
      break;
    }

    case 'auth': {
      try {
        const decoded = jwt.verify(msg.token, JWT_SECRET);
        client.playerId = decoded.id;
        send(ws, { type: 'auth_ok', playerId: client.playerId });
      } catch {
        send(ws, { type: 'auth_fail', message: 'Invalid token' });
      }
      break;
    }

    case 'join_room': {
      const roomId = msg.roomId || 'default';
      if (!rooms.has(roomId)) rooms.set(roomId, new Set());
      rooms.get(roomId).add(ws);
      client.roomId = roomId;
      send(ws, { type: 'room_joined', roomId, playerCount: rooms.get(roomId).size });
      broadcast(roomId, { type: 'player_joined', id: client.id }, ws);
      break;
    }

    case 'player_update': {
      Object.assign(client, {
        x: msg.x, y: msg.y, angle: msg.angle, speed: msg.speed
      });
      if (client.roomId) {
        broadcast(client.roomId, {
          type: 'player_update',
          id: client.id, x: msg.x, y: msg.y, angle: msg.angle, speed: msg.speed
        }, ws);
      }
      // Persist to Redis
      if (redis.isReady) {
        redis.setEx(`player:${client.id}`, 30, JSON.stringify({ x: msg.x, y: msg.y }));
      }
      break;
    }

    case 'carjack': {
      metrics.carjacks++;
      broadcast(client.roomId, {
        type: 'carjack_event',
        by: client.id, carId: msg.carId, x: msg.x, y: msg.y
      });
      break;
    }

    case 'police_chase': {
      msg.start ? metrics.chases++ : metrics.chases--;
      broadcast(client.roomId, {
        type: 'police_chase',
        playerId: client.id, active: msg.start, wantedLevel: msg.wantedLevel
      });
      break;
    }

    case 'mission_update': {
      if (msg.started)  metrics.missions++;
      if (msg.completed || msg.failed) metrics.missions = Math.max(0, metrics.missions - 1);
      broadcast(client.roomId, { type: 'mission_update', ...msg, playerId: client.id });
      break;
    }

    case 'chat': {
      if (!msg.text || msg.text.length > 200) break;
      broadcast(client.roomId, { type: 'chat', from: client.id, text: msg.text });
      break;
    }

    case 'ping': {
      send(ws, { type: 'pong', ts: Date.now() });
      break;
    }

    default:
      metrics.errors++;
      send(ws, { type: 'error', message: `Unknown type: ${msg.type}` });
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function encryptEnvelope(data, sharedSecret) {
  const nonce  = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
  const cipher = sodium.crypto_box_easy_afternm(JSON.stringify(data), nonce, sharedSecret);
  return { __enc: 1, n: sodium.to_base64(nonce), c: sodium.to_base64(cipher) };
}

function decryptEnvelope(env, sharedSecret) {
  try {
    const plain = sodium.crypto_box_open_easy_afternm(
      sodium.from_base64(env.c), sodium.from_base64(env.n), sharedSecret
    );
    return JSON.parse(sodium.to_string(plain));
  } catch {
    metrics.errors++;
    return null;
  }
}

function send(ws, data) {
  if (ws.readyState !== WebSocket.OPEN) return;
  const state = clients.get(ws);
  // Encrypt per-client once the E2E handshake is done (ack itself stays readable
  // because the client derives the secret from the welcome message)
  if (state?.sharedSecret && data.type !== 'key_exchange_ack') {
    ws.send(JSON.stringify(encryptEnvelope(data, state.sharedSecret)));
  } else {
    ws.send(JSON.stringify(data));
  }
}

function broadcast(roomId, data, excludeWs = null) {
  if (!roomId || !rooms.has(roomId)) return;
  for (const ws of rooms.get(roomId)) {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      send(ws, data);
    }
  }
}

function cleanup(ws, client) {
  clients.delete(ws);
  if (client.roomId && rooms.has(client.roomId)) {
    rooms.get(client.roomId).delete(ws);
    broadcast(client.roomId, { type: 'player_left', id: client.id });
    if (rooms.get(client.roomId).size === 0) rooms.delete(client.roomId);
  }
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

// ── Heartbeat ──────────────────────────────────────────────────────────────────
const heartbeat = setInterval(() => {
  for (const [ws] of clients) {
    if (!ws.isAlive) { ws.terminate(); continue; }
    ws.isAlive = false;
    ws.ping();
  }
}, 30_000);

wss.on('close', () => clearInterval(heartbeat));

// ── Start ──────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`[Server] Frasberg game server running on :${PORT}`);
});
