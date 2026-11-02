import Redis from "ioredis";

type Entry = { value: unknown; expiresAt: number };

const globalForCache = globalThis as unknown as {
  __qiongzhiCache?: Map<string, Entry>;
  __qiongzhiRedis?: Redis;
  __qiongzhiRedisDownUntil?: number;
  __qiongzhiInflight?: Map<string, Promise<unknown>>;
};

const memory = (globalForCache.__qiongzhiCache ??= new Map<string, Entry>());
const inflight = (globalForCache.__qiongzhiInflight ??= new Map<string, Promise<unknown>>());

function redisClient(): Redis | null {
  if (!process.env.REDIS_URL) return null;
  if (!globalForCache.__qiongzhiRedis) {
    const client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      lazyConnect: true,
      connectTimeout: 1_500,
    });
    client.on("error", (error) => {
      if (process.env.NODE_ENV !== "test") {
        console.warn("[cache] redis unavailable, using process memory:", error.message);
      }
    });
    globalForCache.__qiongzhiRedis = client;
  }
  return globalForCache.__qiongzhiRedis;
}

/**
 * Read-through cache with in-process single-flight protection.
 * Redis is used in production; a bounded per-process map keeps local
 * development and single-node deployments fully functional.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  const client = redisClient();
  let redisAvailable = Boolean(client) && Date.now() >= (globalForCache.__qiongzhiRedisDownUntil ?? 0);
  if (redisAvailable && client) {
    try {
      if (client.status === "wait") await client.connect();
      const hit = await client.get(key);
      if (hit) return JSON.parse(hit) as T;
    } catch {
      // Keep serving reads from process memory while Redis recovers. Avoid
      // hammering a dead endpoint on every request for the next few seconds.
      globalForCache.__qiongzhiRedisDownUntil = Date.now() + 5_000;
      redisAvailable = false;
    }
  }
  if (!redisAvailable) {
    const hit = memory.get(key);
    if (hit && hit.expiresAt > Date.now()) return hit.value as T;
    if (hit) memory.delete(key);
  }

  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;

  const promise = (async () => {
    const value = await loader();
    if (redisAvailable && client) {
      try {
        await client.set(key, JSON.stringify(value), "EX", ttlSeconds);
      } catch {
        globalForCache.__qiongzhiRedisDownUntil = Date.now() + 5_000;
      }
    } else {
      if (memory.size > 2_000) {
        const first = memory.keys().next().value;
        if (first) memory.delete(first);
      }
      memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1_000 });
    }
    return value;
  })();
  inflight.set(key, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(key);
  }
}

export async function invalidate(...keys: string[]) {
  const client = redisClient();
  if (client && Date.now() >= (globalForCache.__qiongzhiRedisDownUntil ?? 0)) {
    try {
      if (client.status === "wait") await client.connect();
      if (keys.length) await client.del(...keys);
    } catch {
      globalForCache.__qiongzhiRedisDownUntil = Date.now() + 5_000;
    }
  }
  for (const key of keys) memory.delete(key);
}

export async function closeCache() {
  const client = globalForCache.__qiongzhiRedis;
  if (client) await client.quit().catch(() => undefined);
  globalForCache.__qiongzhiRedis = undefined;
  globalForCache.__qiongzhiRedisDownUntil = 0;
  memory.clear();
}
