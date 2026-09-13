import ffmpeg from "fluent-ffmpeg";
import { mkdir } from "fs/promises";
import { join, basename, extname } from "path";
import { db } from "../db/client";
import { submissions } from "../db/schema";
import { eq } from "drizzle-orm";
import type { VideoJobPayload } from "@collabify/shared";

const PROCESSED_DIR = process.env.PROCESSED_DIR ?? "./processed";

export async function processVideo({ submissionId, sourcePath }: VideoJobPayload) {
  console.log(`[video] starting job for submission ${submissionId} (${sourcePath})`);

  await mkdir(PROCESSED_DIR, { recursive: true });
  const base = basename(sourcePath, extname(sourcePath));
  const thumbnailPath = join(PROCESSED_DIR, `${base}.jpg`);
  const videoPath = join(PROCESSED_DIR, `${base}.mp4`);

  await db.update(submissions).set({ status: "processing" }).where(eq(submissions.id, submissionId));

  try {
    console.log(`[video] extracting thumbnail -> ${thumbnailPath}`);
    await extractThumbnail(sourcePath, thumbnailPath);

    console.log(`[video] transcoding -> ${videoPath}`);
    await transcode(sourcePath, videoPath);

    await db
      .update(submissions)
      .set({ status: "ready", thumbnailUrl: thumbnailPath, videoUrl: videoPath })
      .where(eq(submissions.id, submissionId));

    console.log(`[video] done — submission ${submissionId} is now "ready"`);
  } catch (err) {
    console.error(`[video] failed for submission ${submissionId}:`, err);
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
      .on("progress", (p) => console.log(`[video] transcode progress: ${Math.round(p.percent ?? 0)}%`))
      .on("end", () => resolve())
      .on("error", reject)
      .save(output);
  });
}

function dirnameOf(path: string) {
  return path.split("/").slice(0, -1).join("/") || ".";
}