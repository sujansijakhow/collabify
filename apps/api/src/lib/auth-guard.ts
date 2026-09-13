import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db/client";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export const authPlugin = new Elysia({ name: "auth-plugin" })
    .use(jwt({ name: "jwt", secret: process.env.JWT_SECRET ?? "change-me" }))
    .derive({ as: "scoped" }, async ({ jwt, cookie: { auth } }) => {
        const cookieValue = auth?.value;
        if (typeof cookieValue !== "string") return { currentUser: null };

        const payload = await jwt.verify(cookieValue);
        if (!payload) return { currentUser: null };

        const [user] = await db.select().from(users).where(eq(users.id, payload.sub as string)).limit(1);
        return { currentUser: user ?? null };
    });