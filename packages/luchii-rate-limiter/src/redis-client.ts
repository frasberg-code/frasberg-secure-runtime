export interface RedisLike {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
}

let client: RedisLike | undefined;

// The gateway injects a real client (e.g. ioredis) at startup.
export function configureRedis(next: RedisLike | undefined) {
  client = next;
}

export const redis: RedisLike = {
  async incr(key) {
    if (!client) throw new Error('redis not configured');
    return client.incr(key);
  },
  async expire(key, seconds) {
    if (!client) throw new Error('redis not configured');
    return client.expire(key, seconds);
  },
};
