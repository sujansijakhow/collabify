import { Elysia, t } from "elysia";
import { db } from "../db/client";
import { applications, campaigns, users, submissions } from "../db/schema";
import { eq, desc, and } from "drizzle-orm";
import { notificationQueue } from "../lib/queue";
import { publishAnalyticsEvent } from "../lib/kafka";
import { authPlugin } from "../lib/auth-guard";

export const applicationRoutes = new Elysia({ prefix: "/applications" })
  .use(authPlugin)
  .get("/campaign/:campaignId/mine", async ({ params, currentUser, set }) => {
    if (!currentUser || currentUser.role !== "creator") {
      set.status = 403;
      return { error: "Only creator accounts have their own applications" };
    }
    const [existing] = await db
      .select()
      .from(applications)
      .where(and(eq(applications.campaignId, params.campaignId), eq(applications.creatorId, currentUser.id)))
      .limit(1);
    return existing ?? null;
  })
  .get("/campaign/:campaignId", async ({ params, currentUser, set }) => {
    if (!currentUser || currentUser.role !== "brand") {
      set.status = 403;
      return { error: "Only brand accounts can review applications" };
    }
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, params.campaignId)).limit(1);
    if (!campaign || campaign.brandId !== currentUser.id) {
      set.status = 403;
      return { error: "You do not own this campaign" };
    }
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

    const withSubmissions = await Promise.all(
      rows.map(async (row) => {
        const [latest] = await db
          .select()
          .from(submissions)
          .where(eq(submissions.applicationId, row.id))
          .orderBy(desc(submissions.createdAt))
          .limit(1);
        return { ...row, submission: latest ?? null };
      })
    );

    return withSubmissions;
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
  )
  .patch(
    "/:id/status",
    async ({ params, body, currentUser, set }) => {
      if (!currentUser || currentUser.role !== "brand") {
        set.status = 403;
        return { error: "Only brand accounts can update application status" };
      }

      const [application] = await db.select().from(applications).where(eq(applications.id, params.id)).limit(1);
      if (!application) {
        set.status = 404;
        return { error: "Application not found" };
      }

      const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, application.campaignId)).limit(1);
      if (!campaign || campaign.brandId !== currentUser.id) {
        set.status = 403;
        return { error: "You don't own the campaign this application belongs to" };
      }

      const [updated] = await db
        .update(applications)
        .set({ status: body.status })
        .where(eq(applications.id, params.id))
        .returning();

      await notificationQueue.add("application-status-changed", {
        userId: application.creatorId,
        title: body.status === "accepted" ? "You were accepted!" : "Application update",
        body: `Your application to "${campaign.title}" was ${body.status}`,
      });

      return updated;
    },
    { body: t.Object({ status: t.Union([t.Literal("accepted"), t.Literal("rejected")]) }) }
  );