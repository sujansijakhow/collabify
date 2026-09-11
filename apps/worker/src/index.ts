import { Worker } from "bullmq";
import { processVideo } from "./processors/videoProcessor";
import { sendNotification } from "./processors/notificationProcessor";
import { startAnalyticsConsumer } from "./kafka/analyticsConsumer";
import type { VideoJobPayload, NotificationJobPayload } from "@collabify/shared";

const connection = { url: process.env.REDIS_URL ?? "redis://localhost:6379" };

// One BullMQ worker per queue. Concurrency is tuned per workload: video
// transcoding is CPU-heavy so it stays low; notifications are just network
// I/O to Firebase so they can run with much higher concurrency.
new Worker<VideoJobPayload>("video-processing", (job) => processVideo(job.data), {
  connection,
  concurrency: 2,
});

new Worker<NotificationJobPayload>("notifications", (job) => sendNotification(job.data), {
  connection,
  concurrency: 10,
});

await startAnalyticsConsumer();

console.log("[worker] video + notification workers started, listening for jobs");
