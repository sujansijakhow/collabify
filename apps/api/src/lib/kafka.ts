import { Kafka } from "kafkajs";
import type { AnalyticsEvent } from "@collabify/shared";

const kafka = new Kafka({
  clientId: "collabify-api",
  brokers: (process.env.KAFKA_BROKERS ?? "localhost:9092").split(","),
  retry: { retries: 5 },
});

const producer = kafka.producer();
let connected = false;

async function ensureConnected() {
  if (!connected) {
    await producer.connect();
    connected = true;
  }
}

// The API only ever *produces* analytics events onto the "analytics" topic.
// The worker service owns the consumer side and aggregates them.
export async function publishAnalyticsEvent(event: AnalyticsEvent) {
  await ensureConnected();
  await producer.send({
    topic: "analytics",
    messages: [{ key: event.entityId, value: JSON.stringify(event) }],
  });
}
