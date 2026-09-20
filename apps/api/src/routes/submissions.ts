import { Elysia, t } from "elysia";
import { db } from "../db/client";
import { applications, submissions } from "../db/schema";
import { eq } from "drizzle-orm";
import { videoQueue } from "../lib/queue";
import { mkdir } from "fs/promises";
import { join } from "path";
import { authPlugin } from "../lib/auth-guard";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./uploads";

export const submissionRoutes = new Elysia({ prefix: "/submissions" })
  .use(authPlugin)
  .post(
    "/",
    async ({ body, currentUser, set }) => {
      if (!currentUser || currentUser.role !== "creator") {
        set.status = 403;
        return { error: "Only creator accounts can upload deliverables" };
      }

      const [application] = await db
        .select()
        .from(applications)
        .where(eq(applications.id, body.applicationId))
        .limit(1);
      if (!application || application.creatorId !== currentUser.id) {
        set.status = 403;
        return { error: "You can only upload to your own application" };
      }

      await mkdir(UPLOAD_DIR, { recursive: true });
      const ext = body.file.name.split(".").pop() ?? "mp4";
      const filename = `${crypto.randomUUID()}.${ext}`;
      const path = join(UPLOAD_DIR, filename);
      await Bun.write(path, body.file);

      const [submission] = await db
        .insert(submissions)
        .values({ applicationId: body.applicationId, sourceUrl: path, status: "uploaded" })
        .returning();

      await videoQueue.add("process-video", { submissionId: submission.id, sourcePath: path });

      return submission;
    },
    {
      body: t.Object({
        applicationId: t.String(),
        file: t.File({ maxSize: "500m", type: ["video/mp4", "video/quicktime", "video/webm"] }),
      }),
    }
  );