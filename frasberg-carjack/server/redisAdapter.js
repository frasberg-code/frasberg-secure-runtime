// server/redisAdapter.js
// ── Redis Pub/Sub Adapter for multi-server WebSocket scaling ──
import { createClient } from 'redis';
import { EventEmitter } from 'events';

const CHANNEL = 'frasberg:game';

class RedisAdapter extends EventEmitter {
  constructor() {
    super();
    this.publisher  = null;
    this.subscriber = null;
    this.ready      = false;
  }

  async connect() {
    const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    this.publisher  = createClient({ url });
    this.subscriber = createClient({ url });
    this.publisher.on('error',  (e) => console.error('[Redis Publisher]',  e.message));
    this.subscriber.on('error', (e) => console.error('[Redis Subscriber]', e.message));
    await this.publisher.connect();
    await this.subscriber.connect();
    // Subscribe to game channel
    await this.subscriber.subscribe(CHANNEL, (raw) => {
      try {
        const msg = JSON.parse(raw);
        this.emit('message', msg);
      } catch (e) {
        console.error('[Redis] Bad message:', e.message);
      }
    });
    this.ready = true;
    console.log('[Redis Adapter] Connected and subscribed to', CHANNEL);
  }

  // Publish a message to all servers
  async publish(type, data) {
    if (!this.ready) return;
    const payload = JSON.stringify({ type, data, ts: Date.now() });
    await this.publisher.publish(CHANNEL, payload);
  }

  // Buffer offline messages for a player
  async bufferMessage(playerId, message) {
    if (!this.ready) return;
    const key = `offline:${playerId}`;
    await this.publisher.rPush(key, JSON.stringify(message));
    await this.publisher.expire(key, 86400); // 24h TTL
  }

  // Flush buffered messages for a reconnected player
  async flushBuffer(playerId) {
    if (!this.ready) return [];
    const key = `offline:${playerId}`;
    const messages = await this.publisher.lRange(key, 0, -1);
    await this.publisher.del(key);
    return messages.map((m) => JSON.parse(m));
  }

  // Store player session state
  async setPlayerState(playerId, state) {
    if (!this.ready) return;
    await this.publisher.set(
      `player:${playerId}`,
      JSON.stringify(state),
      { EX: 3600 } // 1h TTL
    );
  }

  // Retrieve player session state
  async getPlayerState(playerId) {
    if (!this.ready) return null;
    const raw = await this.publisher.get(`player:${playerId}`);
    return raw ? JSON.parse(raw) : null;
  }

  // Room player count (for load balancing)
  async incrementRoom(roomId) {
    if (!this.ready) return;
    await this.publisher.incr(`room:${roomId}:count`);
    await this.publisher.expire(`room:${roomId}:count`, 3600);
  }

  async decrementRoom(roomId) {
    if (!this.ready) return;
    await this.publisher.decr(`room:${roomId}:count`);
  }

  async getRoomCount(roomId) {
    if (!this.ready) return 0;
    const count = await this.publisher.get(`room:${roomId}:count`);
    return parseInt(count || '0', 10);
  }

  // Leaderboard via Redis Sorted Set
  async updateScore(playerId, score) {
    if (!this.ready) return;
    await this.publisher.zAdd('leaderboard:global', [{ score, value: playerId }]);
  }

  async getTopPlayers(count = 10) {
    if (!this.ready) return [];
    return this.publisher.zRangeWithScores('leaderboard:global', 0, count - 1, { REV: true });
  }

  async disconnect() {
    await this.publisher?.quit();
    await this.subscriber?.quit();
    this.ready = false;
    console.log('[Redis Adapter] Disconnected.');
  }
}

// Singleton export
export const redisAdapter = new RedisAdapter();
