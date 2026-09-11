import { Elysia, t } from "elysia";
import { db } from "../db/client";
import { campaigns } from "../db/schema";
import { eq } from "drizzle-orm";
import { cacheCampaignList, invalidateCampaignList } from "../lib/redis";
import { publishAnalyticsEvent } from "../lib/kafka";

export const campaignRoutes = new Elysia({ prefix: "/campaigns" })
  .get("/", async ({ query }) => {
    const status = query.status ?? "open";
    // Cached in Redis for 30s — campaign listings are read far more than written.
    return cacheCampaignList(`campaigns:list:${status}`, () =>
      db.select().from(campaigns).where(eq(campaigns.status, status as any))
    );
  })
  .get("/:id", async ({ params, set }) => {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, params.id)).limit(1);
    if (!campaign) {
      set.status = 404;
      return { error: "Campaign not found" };
    }
    // Fire-and-forget analytics event -> Kafka -> worker aggregates view counts.
    void publishAnalyticsEvent({ type: "campaign.viewed", entityId: campaign.id, ts: new Date().toISOString() });
    return campaign;
  })
  .post(
    "/",
    async ({ body }) => {
      const [campaign] = await db.insert(campaigns).values(body).returning();
      await invalidateCampaignList();
      return campaign;
    },
    {
      body: t.Object({
        brandId: t.String(),
        title: t.String(),
        description: t.String(),
        budgetCents: t.Number(),
        status: t.Optional(t.Union([t.Literal("draft"), t.Literal("open"), t.Literal("closed")])),
      }),
    }
  );
