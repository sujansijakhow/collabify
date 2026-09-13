import { Elysia, t } from "elysia";
import { db } from "../db/client";
import { applications, campaigns, users } from "../db/schema";
import { eq } from "drizzle-orm";
import { notificationQueue } from "../lib/queue";
import { publishAnalyticsEvent } from "../lib/kafka";
import { authPlugin } from "../lib/auth-gurad";

export const applicationRoutes = new Elysia({ prefix: "/applications" })
  .use(authPlugin)
  .get("/campaign/:campaignId", async ({ params }) => {
    const rows = await db
      .select({
        id: applications.id,
        campaignId: applications.campaignId,
        creatorId: applications.creatorId,
        creatorName: users.name,
        pitch: applications.pitch,
        status: applications.status,
        createdAt: applications.createdAt,
      })
      .from(applications)
      .innerJoin(users, eq(users.id, applications.creatorId))
      .where(eq(applications.campaignId, params.campaignId));
    return rows;
  })
  .post(
    "/",
    async ({ body, currentUser, set }) => {
      if (!currentUser || currentUser.role !== "creator") {
        set.status = 403;
        return { error: "Only creator accounts can apply to campaigns" };
      }

      const [application] = await db
        .insert(applications)
        .values({ campaignId: body.campaignId, creatorId: currentUser.id, pitch: body.pitch })
        .returning();

      await publishAnalyticsEvent({
        type: "application.submitted",
        entityId: application.campaignId,
        userId: application.creatorId,
        ts: new Date().toISOString(),
      });

      const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, body.campaignId)).limit(1);
      if (campaign) {
        await notificationQueue.add("application-received", {
          userId: campaign.brandId,
          title: "New application",
          body: `${currentUser.name} just applied to your campaign`,
        });
      }

      return application;
    },
    { body: t.Object({ campaignId: t.String(), pitch: t.String() }) }
  );