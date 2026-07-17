import { config } from "dotenv";
config({ path: ".env.local" });

import { execSync } from "child_process";
execSync("npx drizzle-kit push --force", {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
});
