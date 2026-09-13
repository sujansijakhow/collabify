import { Elysia, t } from "elysia";
import { db } from "../db/client";
import { campaigns } from "../db/schema";
import { eq } from "drizzle-orm";
import { cacheCampaignList, invalidateCampaignList } from "../lib/redis";
import { publishAnalyticsEvent } from "../lib/kafka";
import { authPlugin } from "../lib/auth-guard";

export const campaignRoutes = new Elysia({ prefix: "/campaigns" })
  .use(authPlugin)
  .get("/", async ({ query }) => {
    const status = query.status ?? "open";
    return cacheCampaignList(`campaigns:list:${status}`, () =>
      db.select().from(campaigns).where(eq(campaigns.status, status as any))
    );
  })
  .get("/mine", async ({ currentUser, set }) => {
    if (!currentUser || currentUser.role !== "brand") {
      set.status = 403;
      return { error: "Only brand accounts have a campaign list" };
    }
    return db.select().from(campaigns).where(eq(campaigns.brandId, currentUser.id));
  })
  .get("/:id", async ({ params, set }) => {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, params.id)).limit(1);
    if (!campaign) {
      set.status = 404;
      return { error: "Campaign not found" };
    }
    void publishAnalyticsEvent({ type: "campaign.viewed", entityId: campaign.id, ts: new Date().toISOString() });
    return campaign;
  })
  .post(
    "/",
    async ({ body, currentUser, set }) => {
      if (!currentUser || currentUser.role !== "brand") {
        set.status = 403;
        return { error: "Only brand accounts can create campaigns" };
      }
      const [campaign] = await db
        .insert(campaigns)
        .values({ ...body, brandId: currentUser.id })
        .returning();
      await invalidateCampaignList();
      return campaign;
    },
    {
      body: t.Object({
        title: t.String(),
        description: t.String(),
        budgetCents: t.Number(),
        status: t.Optional(t.Union([t.Literal("draft"), t.Literal("open"), t.Literal("closed")])),
      }),
    }
  );