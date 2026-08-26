import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

const isConfigured = connectionString && !connectionString.includes("[YOUR-PASSWORD]");

if (!isConfigured) {
  console.warn("DATABASE_URL belum diatur dengan password yang valid di .env.local.");
}

const client = isConfigured
  ? postgres(connectionString, { prepare: false })
  : null;

export const db = client ? drizzle(client, { schema }) : null;
