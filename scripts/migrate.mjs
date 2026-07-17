import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL);

try {
  await sql`ALTER TABLE "thoughts" ADD COLUMN IF NOT EXISTS "description" text`;
  console.log("Added description column to thoughts table");
} catch (e) {
  console.error("Migration failed:", e.message);
}

await sql.end();
