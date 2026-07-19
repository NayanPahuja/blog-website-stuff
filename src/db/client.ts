/**
 * Edge-safe Drizzle client over `postgres.js`.
 *
 * Connection strategy (TRD §9):
 *  - Use the POOLED (transaction-mode) connection string from Supabase
 *    (port 6543, host `*.pooler.supabase.com`). Direct connections (5432)
 *    exhaust quickly from short-lived Cloudflare Workers.
 *  - On Cloudflare Workers, `postgres.js` uses TCP via the `nodejs_compat`
 *    flag (set in wrangler.jsonc). In Node/local dev it connects normally.
 *
 * DEPLOY VERIFICATION (Phase 0 exit): with `DATABASE_URL` set locally,
 * `npm run db:push` must succeed. On Workers, confirm a read works from a
 * route handler after the first deploy.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Pooled/Supabase transaction-mode connections require `prepare: false`.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // Don't throw at module load — local dev without a DB should still let
  // the app boot (the home page degrades gracefully). Routes that need the
  // DB will surface a clear error instead.
  console.warn("[db] DATABASE_URL is not set — database features disabled.");
}

// Lazy singleton: create the client once per process/isolate.
let _query: ReturnType<typeof postgres> | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function getClient() {
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not configured. Set it in .env.local (dev) or as a Worker secret (prod).",
    );
  }
  if (!_query) {
    _query = postgres(connectionString, {
      // Pooled/Supabase transaction mode requires `prepare: false`.
      prepare: false,
      // One connection per isolate is enough for a low-traffic site.
      max: 1,
      // Cloudflare silently reaps idle TCP sockets between requests, and
      // Supabase's pooler closes them too. If a warm isolate reuses such a
      // half-open socket, postgres.js waits forever ("Connection closed" /
      // Worker 1101 hung-request). Closing idle connections after 1s forces
      // a fresh socket for the next request instead of reusing a dead one.
      idle_timeout: 1,
      // Recycle connections aggressively as an extra guard against stale
      // sockets surviving in a long-lived warm isolate.
      max_lifetime: 60,
      // Fail fast on connect instead of hanging until the runtime cancels
      // the request.
      connect_timeout: 10,
    });
    _db = drizzle(_query, { schema });
  }
  return _db!;
}

/**
 * The Drizzle ORM client, schema-bound. Throws if DATABASE_URL is missing so
 * callers fail loudly rather than silently dropping data.
 */
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    const client = getClient();
    // @ts-expect-error -- forward property access to the real client
    return client[prop];
  },
});

export { schema };
