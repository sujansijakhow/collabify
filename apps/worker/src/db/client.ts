import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL ?? "postgres://collabify:collabify@localhost:5432/collabify";
export const db = drizzle(postgres(connectionString), { schema });
