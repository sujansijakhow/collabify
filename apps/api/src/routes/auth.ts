import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db/client";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(jwt({ name: "jwt", secret: process.env.JWT_SECRET ?? "change-me" }))
  .post(
    "/register",
    async ({ body, jwt, cookie: { auth } }) => {
      const passwordHash = await Bun.password.hash(body.password);
      const [user] = await db
        .insert(users)
        .values({ email: body.email, name: body.name, role: body.role, passwordHash })
        .returning();

      const token = await jwt.sign({ sub: user.id, role: user.role });
      auth.set({ value: token, httpOnly: true, maxAge: 7 * 86400, path: "/" });
      return { id: user.id, email: user.email, name: user.name, role: user.role };
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        name: t.String(),
        password: t.String({ minLength: 8 }),
        role: t.Union([t.Literal("creator"), t.Literal("brand")]),
      }),
    }
  )
  .post(
    "/login",
    async ({ body, jwt, cookie: { auth }, set }) => {
      const [user] = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
      if (!user || !(await Bun.password.verify(body.password, user.passwordHash))) {
        set.status = 401;
        return { error: "Invalid email or password" };
      }
      const token = await jwt.sign({ sub: user.id, role: user.role });
      auth.set({ value: token, httpOnly: true, maxAge: 7 * 86400, path: "/" });
      return { id: user.id, email: user.email, name: user.name, role: user.role };
    },
    { body: t.Object({ email: t.String(), password: t.String() }) }
  );
