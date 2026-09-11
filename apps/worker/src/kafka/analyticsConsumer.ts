import { Kafka } from "kafkajs";
import Redis from "ioredis";
import { db } from "../db/client";
import { analyticsCounters } from "../db/schema";
import { eq, and } from "drizzle-orm";
import type { AnalyticsEvent } from "@collabify/shared";

const kafka = new Kafka({
  clientId: "collabify-worker",
  brokers: (process.env.KAFKA_BROKERS ?? "localhost:9092").split(","),
  retry: { retries: 5 },
});

const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");

/**
 * Consumes the "analytics" topic the API produces to on every campaign view,
 * submission view, and application. Rather than writing to Postgres on every
 * single event (which would hammer the DB under real traffic), counts are
 * incremented in Redis first and flushed to Postgres every FLUSH_INTERVAL_MS.
 * This is the classic "hot counter" pattern Kafka + Redis are good at.
 */
const FLUSH_INTERVAL_MS = 10_000;
const REDIS_KEY_PREFIX = "analytics:pending";

export async function startAnalyticsConsumer() {
  const consumer = kafka.consumer({ groupId: "analytics-aggregator" });
  await consumer.connect();
  await consumer.subscribe({ topic: "analytics", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const event = JSON.parse(message.value.toString()) as AnalyticsEvent;
      await redis.hincrby(`${REDIS_KEY_PREFIX}:${event.type}`, event.entityId, 1);
    },
  });

  setInterval(flushCountersToPostgres, FLUSH_INTERVAL_MS);
  console.log("[worker] analytics consumer running");
}

async function flushCountersToPostgres() {
  const keys = await redis.keys(`${REDIS_KEY_PREFIX}:*`);
  for (const key of keys) {
    const eventType = key.split(":").pop()!;
    const counts = await redis.hgetall(key);
    for (const [entityId, countStr] of Object.entries(counts)) {
      const delta = Number(countStr);
      if (!delta) continue;

      const [existing] = await db
        .select()
        .from(analyticsCounters)
        .where(and(eq(analyticsCounters.entityId, entityId), eq(analyticsCounters.eventType, eventType)))
        .limit(1);

      if (existing) {
        await db
          .update(analyticsCounters)
          .set({ count: existing.count + delta, updatedAt: new Date() })
          .where(eq(analyticsCounters.id, existing.id));
      } else {
        await db.insert(analyticsCounters).values({ entityId, eventType, count: delta });
      }
    }
    await redis.del(key);
  }
}
