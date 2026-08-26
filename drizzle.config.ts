import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl || dbUrl.includes("[YOUR-PASSWORD]")) {
  console.warn("⚠️ DATABASE_URL belum diisi dengan password Supabase di .env.local");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl && !dbUrl.includes("[YOUR-PASSWORD]") ? dbUrl : "postgresql://postgres:postgres@localhost:5432/postgres",
  },
  strict: true,
  verbose: true,
});

