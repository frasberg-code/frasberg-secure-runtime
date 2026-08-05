// ── Frasberg Carjack — MultiplayerClient ──────────────────────────────────────
// WebSocket client with E2E encryption handshake, auto-reconnect, latency
// tracking and remote player rendering.

import { EncryptionLayer } from './EncryptionLayer.js';
import { drawVehicle } from './CarSprites.js';

const REMOTE_SPEC = { brand: 'Frasberg', model: 'GT', tier: 'sport', color: '#3a86ff', length: 4.7 };

export class MultiplayerClient {
  constructor(player) {
    this.player    = player;
    this.ws        = null;
    this.id        = null;
    this.roomId    = 'default';
    this.token     = null;
    this.enc       = new EncryptionLayer();
    this.secure    = false;   // true after key_exchange_ack
    this.latency   = 0;
    this.remote    = new Map();  // id → { x, y, angle, speed, lastSeen }
    this.listeners = new Map();
    this._reconnects   = 0;
    this._maxReconnects = 8;
    this._everConnected = false;
    this._closed   = false;
    this._lastSend = 0;
    this._pingTimer = null;
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  _url() {
    if (import.meta.env?.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${location.host}/ws`;
  }

  async connect(roomId = 'default', token = null) {
    this.roomId = roomId;
    this.token  = token;
    this._closed = false;
    if (!this.enc.ready) await this.enc.init();
    this._open();
  }

  _open() {
    try {
      this.ws = new WebSocket(this._url());
    } catch (e) {
      console.warn('[Multiplayer] Cannot open socket:', e.message);
      this._scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      console.log('[Multiplayer] Connected.');
      this._reconnects = 0;
      this._everConnected = true;
      this._emit('connected');
      clearInterval(this._pingTimer);
      this._pingTimer = setInterval(() => {
        this.send('ping', { ts: Date.now() });
      }, 3000);
    };

    this.ws.onmessage = (evt) => this._onMessage(evt.data);

    this.ws.onclose = (evt) => {
      clearInterval(this._pingTimer);
      this.secure = false;
      this.enc.sharedSecret = null;
      if (evt.code === 1008) {
        this._emit('kicked', evt.reason || 'Policy violation');
        return;
      }
      if (!this._closed) {
        if (this._everConnected) this._emit('disconnected');
        this._scheduleReconnect();
      }
    };

    this.ws.onerror = () => {};
  }

  _scheduleReconnect() {
    if (this._closed) return;
    // No game server reachable at all → go solo quietly after a couple of tries
    const budget = this._everConnected ? this._maxReconnects : 2;
    if (this._reconnects >= budget) {
      if (this._everConnected) {
        console.warn('[Multiplayer] Max reconnect attempts reached.');
        this._emit('failed');
      } else {
        console.log('[Multiplayer] No game server — running in solo mode.');
      }
      return;
    }
    const delay = Math.min(30000, 1000 * Math.pow(2, this._reconnects++));
    console.log(`[Multiplayer] Reconnecting in ${delay}ms (attempt ${this._reconnects})`);
    setTimeout(() => this._open(), delay);
  }

  // ── Inbound ─────────────────────────────────────────────────────────────────
  _onMessage(raw) {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    if (msg.__enc) {
      msg = this.enc.decrypt(msg);
      if (!msg) return;
    }

    switch (msg.type) {
      case 'welcome': {
        this.id = msg.id ?? msg.playerId;
        if (msg.serverPublicKey && this.enc.ready) {
          this.enc.deriveSharedSecret(msg.serverPublicKey);
          this._sendPlain('key_exchange', { publicKey: this.enc.publicKeyB64 });
        }
        if (this.token) this._sendPlain('auth', { token: this.token });
        this._sendPlain('join_room', { roomId: this.roomId });
        break;
      }
      case 'key_exchange_ack': {
        this.secure = true;
        console.log('[Multiplayer] 🔐 Secure channel established.');
        this._emit('encrypted');
        break;
      }
      case 'room_joined': {
        console.log(`[Multiplayer] Joined room ${msg.roomId} (${msg.playerCount} players)`);
        break;
      }
      case 'player_update': {
        if (msg.id === this.id) break;
        this.remote.set(msg.id, {
          x: msg.x, y: msg.y, angle: msg.angle ?? 0,
          speed: msg.speed ?? 0, lastSeen: Date.now(),
        });
        break;
      }
      case 'player_joined': {
        this._emit('player_joined', msg);
        break;
      }
      case 'player_left': {
        this.remote.delete(msg.id);
        this._emit('player_left', msg);
        break;
      }
      case 'pong': {
        if (msg.ts) this.latency = Date.now() - msg.ts;
        this._emit('latency', this.latency);
        break;
      }
      default:
        break;
    }
    this._emit(msg.type, msg);
  }

  // ── Outbound ────────────────────────────────────────────────────────────────
  _sendPlain(type, payload = {}) {
    if (!this.isConnected) return;
    this.ws.send(JSON.stringify({ type, ...payload }));
  }

  send(type, payload = {}) {
    if (!this.isConnected) return;
    const data = { type, ...payload };
    const out  = this.secure ? this.enc.encrypt(data) : data;
    this.ws.send(JSON.stringify(out));
  }

  // Throttled to 20 Hz — called every frame by GameEngine
  sendUpdate(player) {
    if (!this.isConnected) return;
    const now = performance.now();
    if (now - this._lastSend < 50) return;
    this._lastSend = now;
    this.send('player_update', {
      x: player.x, y: player.y,
      angle: player.angle, speed: player.speed,
      wantedLevel: player.wantedLevel,
    });
  }

  sendCarjack(carId, x, y)   { this.send('carjack', { carId, x, y }); }
  sendChat(text)             { this.send('chat', { text }); }

  // ── Remote player rendering (screen space; camX/camY = camera offset) ──────
  renderOtherPlayers(ctx, camX, camY) {
    const now = Date.now();
    for (const [id, p] of this.remote) {
      if (now - p.lastSeen > 10000) { this.remote.delete(id); continue; }
      ctx.save();
      ctx.translate(p.x + camX, p.y + camY);
      ctx.save();
      ctx.rotate((p.angle ?? 0) * Math.PI / 180 + Math.PI);
      drawVehicle(ctx, REMOTE_SPEC);
      ctx.restore();
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(-30, -42, 60, 14);
      ctx.fillStyle = '#3a86ff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(String(id).slice(0, 8), 0, -32);
      ctx.textAlign = 'left';
      ctx.restore();
    }
  }

  on(event, handler) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(handler);
  }

  off(event, handler) {
    const list = this.listeners.get(event) || [];
    this.listeners.set(event, list.filter(h => h !== handler));
  }

  _emit(event, data) {
    for (const fn of this.listeners.get(event) || []) {
      try { fn(data); } catch (e) { console.error(`[Multiplayer] handler error (${event}):`, e); }
    }
  }

  disconnect() {
    this._closed = true;
    clearInterval(this._pingTimer);
    this.ws?.close(1000, 'Client disconnect');
    this.remote.clear();
    this.enc.destroy();
  }
}
