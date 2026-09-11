import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

// One connection for general cache/pubsub use, plus two dedicated connections
// for the Socket.io Redis adapter (it needs its own pub/sub pair).
export const redis = new Redis(REDIS_URL);
export const redisPub = new Redis(REDIS_URL);
export const redisSub = redisPub.duplicate();

const CAMPAIGN_LIST_TTL = 30; // seconds

export async function cacheCampaignList<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached) as T;
  const fresh = await fetcher();
  await redis.set(key, JSON.stringify(fresh), "EX", CAMPAIGN_LIST_TTL);
  return fresh;
}

export async function invalidateCampaignList() {
  const keys = await redis.keys("campaigns:list:*");
  if (keys.length) await redis.del(...keys);
}
