import { Elysia } from "elysia";
import { db } from "../db/client";
import { messages } from "../db/schema";
import { eq, asc } from "drizzle-orm";

// REST endpoint only serves chat *history* on room load. New messages after
// that flow entirely over the Socket.io connection — see src/sockets/index.ts.
export const messageRoutes = new Elysia({ prefix: "/messages" }).get("/campaign/:campaignId", async ({ params }) =>
  db.select().from(messages).where(eq(messages.campaignId, params.campaignId)).orderBy(asc(messages.createdAt))
);
