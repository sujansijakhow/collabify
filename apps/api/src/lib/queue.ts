import { Queue } from "bullmq";
import type { VideoJobPayload, NotificationJobPayload } from "@collabify/shared";

const connection = { url: process.env.REDIS_URL ?? "redis://localhost:6379" };

// Producer-side queue handles. The actual processing logic lives in
// apps/worker so the API stays a thin, fast request layer.
export const videoQueue = new Queue<VideoJobPayload>("video-processing", { connection });
export const notificationQueue = new Queue<NotificationJobPayload>("notifications", { connection });
