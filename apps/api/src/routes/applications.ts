import { Elysia, t } from "elysia";
import { db } from "../db/client";
import { applications } from "../db/schema";
import { eq } from "drizzle-orm";
import { notificationQueue } from "../lib/queue";
import { publishAnalyticsEvent } from "../lib/kafka";

export const applicationRoutes = new Elysia({ prefix: "/applications" })
  .get("/campaign/:campaignId", async ({ params }) =>
    db.select().from(applications).where(eq(applications.campaignId, params.campaignId))
  )
  .post(
    "/",
    async ({ body }) => {
      const [application] = await db.insert(applications).values(body).returning();

      await publishAnalyticsEvent({
        type: "application.submitted",
        entityId: application.campaignId,
        userId: application.creatorId,
        ts: new Date().toISOString(),
      });

      // Enqueue a push notification job for the brand instead of sending inline —
      // keeps the request fast and lets the worker retry on Firebase hiccups.
      await notificationQueue.add("application-received", {
        userId: application.campaignId, // resolved to the brand's userId by the worker
        title: "New application",
        body: "A creator just applied to your campaign",
      });

      return application;
    },
    {
      body: t.Object({
        campaignId: t.String(),
        creatorId: t.String(),
        pitch: t.String(),
      }),
    }
  );
