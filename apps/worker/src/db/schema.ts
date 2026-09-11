// The worker intentionally keeps its own minimal view of the tables it
// touches, rather than importing the API's schema module directly — each
// service owns its own read/write contract against the shared database.
import { pgTable, text, timestamp, integer, uniqueIndex } from "drizzle-orm/pg-core";

export const submissions = pgTable("submissions", {
  id: text("id").primaryKey(),
  applicationId: text("application_id").notNull(),
  sourceUrl: text("source_url").notNull(),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  fcmToken: text("fcm_token"),
});

export const analyticsCounters = pgTable(
  "analytics_counters",
  {
    id: text("id").primaryKey(),
    entityId: text("entity_id").notNull(),
    eventType: text("event_type").notNull(),
    count: integer("count").notNull().default(0),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({ entityEventIdx: uniqueIndex("analytics_entity_event_idx").on(t.entityId, t.eventType) })
);
