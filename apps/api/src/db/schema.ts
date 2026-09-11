import { pgTable, text, timestamp, integer, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const userRole = pgEnum("user_role", ["creator", "brand", "admin"]);
export const campaignStatus = pgEnum("campaign_status", ["draft", "open", "closed"]);
export const applicationStatus = pgEnum("application_status", ["pending", "accepted", "rejected"]);
export const submissionStatus = pgEnum("submission_status", ["uploaded", "processing", "ready", "failed"]);

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey().$defaultFn(() => nanoid()),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRole("role").notNull().default("creator"),
    avatarUrl: text("avatar_url"),
    fcmToken: text("fcm_token"), // Firebase Cloud Messaging push token
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({ emailIdx: uniqueIndex("users_email_idx").on(t.email) })
);

export const campaigns = pgTable("campaigns", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  brandId: text("brand_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  budgetCents: integer("budget_cents").notNull().default(0),
  status: campaignStatus("status").notNull().default("draft"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const applications = pgTable("applications", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  campaignId: text("campaign_id").notNull().references(() => campaigns.id),
  creatorId: text("creator_id").notNull().references(() => users.id),
  pitch: text("pitch").notNull(),
  status: applicationStatus("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const submissions = pgTable("submissions", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  applicationId: text("application_id").notNull().references(() => applications.id),
  sourceUrl: text("source_url").notNull(),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  status: submissionStatus("status").notNull().default("uploaded"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  campaignId: text("campaign_id").notNull().references(() => campaigns.id),
  senderId: text("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Aggregated analytics counters, populated by the worker's Kafka consumer.
export const analyticsCounters = pgTable(
  "analytics_counters",
  {
    id: text("id").primaryKey().$defaultFn(() => nanoid()),
    entityId: text("entity_id").notNull(),
    eventType: text("event_type").notNull(),
    count: integer("count").notNull().default(0),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({ entityEventIdx: uniqueIndex("analytics_entity_event_idx").on(t.entityId, t.eventType) })
);
