import ffmpeg from "fluent-ffmpeg";
import { mkdir } from "fs/promises";
import { join, basename, extname } from "path";
import { db } from "../db/client";
import { submissions } from "../db/schema";
import { eq } from "drizzle-orm";
import type { VideoJobPayload } from "@collabify/shared";

const PROCESSED_DIR = process.env.PROCESSED_DIR ?? "./processed";

/**
 * Runs for every "process-video" job added to the `video-processing` BullMQ
 * queue by the API's submissions route. Two ffmpeg passes:
 *   1. A JPEG thumbnail grabbed at the 2s mark.
 *   2. A web-friendly H.264/AAC MP4 transcode (source could be any codec a
 *      creator's phone produced).
 * On success the submission row is updated and its status flips to "ready";
 * the web app finds out over the "submission:status" socket event, which the
 * API emits by watching the same Postgres row (or, more simply, the worker
 * enqueues a tiny notification job - see notificationProcessor.ts).
 */
export async function processVideo({ submissionId, sourcePath }: VideoJobPayload) {
  await mkdir(PROCESSED_DIR, { recursive: true });
  const base = basename(sourcePath, extname(sourcePath));
  const thumbnailPath = join(PROCESSED_DIR, `${base}.jpg`);
  const videoPath = join(PROCESSED_DIR, `${base}.mp4`);

  await db.update(submissions).set({ status: "processing" }).where(eq(submissions.id, submissionId));

  try {
    await extractThumbnail(sourcePath, thumbnailPath);
    await transcode(sourcePath, videoPath);

    await db
      .update(submissions)
      .set({ status: "ready", thumbnailUrl: thumbnailPath, videoUrl: videoPath })
      .where(eq(submissions.id, submissionId));
  } catch (err) {
    await db.update(submissions).set({ status: "failed" }).where(eq(submissions.id, submissionId));
    throw err;
  }
}

function extractThumbnail(input: string, output: string) {
  return new Promise<void>((resolve, reject) => {
    ffmpeg(input)
      .on("end", () => resolve())
      .on("error", reject)
      .screenshots({ timestamps: ["2"], filename: basename(output), folder: dirnameOf(output), size: "640x?" });
  });
}

function transcode(input: string, output: string) {
  return new Promise<void>((resolve, reject) => {
    ffmpeg(input)
      .videoCodec("libx264")
      .audioCodec("aac")
      .outputOptions(["-movflags +faststart", "-crf 23", "-preset veryfast"])
      .on("end", () => resolve())
      .on("error", reject)
      .save(output);
  });
}

function dirnameOf(path: string) {
  return path.split("/").slice(0, -1).join("/") || ".";
}
