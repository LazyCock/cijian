import Redis from "ioredis";

const globalForRate = globalThis as unknown as {
  __qiongzhiRate?: Map<string, { count: number; resetAt: number }>;
  __qiongzhiRateRedis?: Redis;
  __qiongzhiRateRedisDownUntil?: number;
};

const memory = (globalForRate.__qiongzhiRate ??= new Map());

function redisClient(): Redis | null {
  if (!process.env.REDIS_URL) return null;
  if (!globalForRate.__qiongzhiRateRedis) {
    const client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      connectTimeout: 1_000,
    });
    client.on("error", () => undefined);
    globalForRate.__qiongzhiRateRedis = client;
  }
  return globalForRate.__qiongzhiRateRedis;
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

/**
 * Fixed-window limiter. Redis is shared across app replicas in production.
 * The memory fallback protects a single process when Redis is not configured.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const client = redisClient();
  const resetAt = Date.now() + windowSeconds * 1_000;
  const canUseRedis = Boolean(client) && Date.now() >= (globalForRate.__qiongzhiRateRedisDownUntil ?? 0);
  if (canUseRedis && client) {
    try {
      if (client.status === "wait") await client.connect();
      const count = await client.incr(key);
      if (count === 1) await client.expire(key, windowSeconds);
      return { allowed: count <= limit, remaining: Math.max(0, limit - count), resetAt };
    } catch {
      globalForRate.__qiongzhiRateRedisDownUntil = Date.now() + 5_000;
    }
  }
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.resetAt <= now) {
    memory.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }
  entry.count += 1;
  return { allowed: entry.count <= limit, remaining: Math.max(0, limit - entry.count), resetAt };
}

export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "local"
  );
}
