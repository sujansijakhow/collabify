import { Elysia } from "elysia";
import { join, basename } from "path";

const PROCESSED_DIR = process.env.PROCESSED_DIR ?? "./processed";

export const mediaRoutes = new Elysia({ prefix: "/media" }).get("/processed/:filename", async ({ params, set }) => {
  const safeName = basename(params.filename);
  const file = Bun.file(join(PROCESSED_DIR, safeName));
  if (!(await file.exists())) {
    set.status = 404;
    return { error: "File not found" };
  }
  return file;
});