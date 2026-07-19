# Deployment Plan — Cloudflare + Supabase

Companion to TRD.md. Everything today runs against a **local** Supabase stack
(`http://127.0.0.1:54321`, `DATABASE_URL` pointing at `127.0.0.1:54322`) — no
hosted Supabase project exists yet, and this app has never been built/run
through the Cloudflare Workers pipeline (`npm run preview` / `npm run deploy`
have not been exercised). This plan takes it from that state to live.

Scaffolding for the Workers side is already in place — `wrangler.jsonc`
(worker name `knowledge-garden`, `nodejs_compat` flag, assets binding, self
-reference service binding, images binding), `open-next.config.ts`, and the
`preview`/`deploy`/`upload` scripts in `package.json` — so this is wiring real
credentials into existing config, not building the pipeline from scratch.

---

## Pre-deploy reality check

A few things worth knowing going in, so nothing here reads as more finished
than it is:

- **RLS policies don't exist yet** (no RLS SQL anywhere in the repo — TRD
  documents it as a plan, not a fact). This turns out to be **not a blocker**:
  every data query in this app goes through Drizzle over the pooled Postgres
  connection string (`src/db/client.ts`), server-side only, with full DB
  privileges — nothing client-side ever queries Postgres via `supabase-js`
  `.from()`/PostgREST. RLS is genuinely unused by this app's current
  architecture. Still worth adding as defense-in-depth before or shortly
  after launch (see Phase 6), but it does not block going live.
- **No image upload route** (`/api/upload` doesn't exist). Supabase Storage
  bucket setup is therefore optional for this deploy — skip it, or create an
  empty bucket now so it's ready when that feature ships.
- **`edra-react` is an npm workspace member**, symlinked into `node_modules`.
  This has never been run through `@opennextjs/cloudflare`'s bundler. Treat
  `npm run preview` (Phase 4) as load-bearing, not optional — it's the first
  real test that the Workers build handles the workspace link, and the
  mermaid/katex/radix dependency tree, correctly.
- Admin auth is single-user, password-based (`/api/admin/login` →
  `supabase.auth.signInWithPassword`) — there's no signup flow, so the admin
  user must be created manually (Phase 1).

---

## Phase 1 — Supabase project (production)

1. Create a new project at supabase.com (pick a region close to wherever
   Cloudflare will route from, or close to you — Workers are edge-distributed
   regardless, but Postgres itself is regional).
2. From Project Settings → API, collect:
   - Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
   - `anon` public key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - `service_role` secret key (`SUPABASE_SERVICE_ROLE_KEY`) — never expose
     client-side, used only by `src/lib/supabase/admin.ts`.
3. From Project Settings → Database → Connection string, use the **pooled,
   transaction-mode** string (port `6543`, host `*.pooler.supabase.com`) —
   not the direct connection (port `5432`). TRD §9 explains why: Workers are
   short-lived and exhaust direct connections quickly. This is
   `DATABASE_URL`.
4. Create the admin user: Authentication → Users → Add user (email +
   password), or via the Supabase CLI. This is the one account
   `requireAdmin()` (`src/lib/auth.ts`) treats as authorized for everything
   under `/admin/*`.

## Phase 2 — Push the schema

The schema is already correct and migration-tested locally (`drizzle/0000_init_content_model.sql` — the unified `contents` + `blog_details`/`project_details` model). Two ways to apply it to the new production database, pick one:

- **`npm run db:push`** with `DATABASE_URL` (in `.env.local`, temporarily) pointed at the new prod pooled connection string — `drizzle-kit push` diffs and applies directly. Fastest for a brand-new, empty database.
- **`npm run db:migrate`** (`scripts/migrate.mjs`, uses `drizzle-orm/postgres-js/migrator`) — runs the actual migration file. More "proper" since it's the same mechanism you'd use for future migrations, and it recorded in Postgres's own migration-tracking table.

Either way: **do this against the pooled prod connection string, not local.** Verify after:

```sql
\dt public.*   -- should list: contents, blog_details, project_details, tags, content_tags, images, content_images, page_views
```

## Phase 3 — Environment variables

Local (`.env.local`) and production (Cloudflare) are configured differently — non-secret values live in `wrangler.jsonc`, secrets are pushed via `wrangler secret put`:

**Public, non-secret** (edit `wrangler.jsonc`'s `vars` block directly, commit it):
```jsonc
"vars": {
  "NEXT_PUBLIC_SUPABASE_URL": "https://<project-ref>.supabase.co",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY": "<anon-key>"
}
```
These are public by design (the anon key is safe in the browser bundle — same key already ships to every client today, it's not a real secret).

**Server secrets** (never in `wrangler.jsonc`, never committed):
```bash
npx wrangler secret put DATABASE_URL
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```
Paste the pooled connection string / service-role key when prompted.

## Phase 4 — Cloudflare account + first build

1. `npx wrangler login` (one-time, opens a browser to authorize).
2. `npm run preview` — runs `opennextjs-cloudflare build && opennextjs-cloudflare preview`, i.e. builds the OpenNext output and runs it locally under `wrangler dev`, simulating the actual Workers runtime (not just Next's own dev server). **This is the real test** for the workspace-linked `edra-react` package and its dependency tree (mermaid, katex, radix, tiptap) bundling correctly for Workers. Fix here, not after a real deploy, if anything breaks.
3. Smoke-test against the preview: log into `/admin`, open the thought/blog editor (confirms `edra-react`'s dynamic `ssr:false` chunk loads and the toolbar renders), publish something, hit the public `/blogs/[slug]` page.

## Phase 5 — Deploy

```bash
npm run deploy   # opennextjs-cloudflare build && opennextjs-cloudflare deploy
```

This publishes to `knowledge-garden.<your-subdomain>.workers.dev` (worker name from `wrangler.jsonc`). Confirm:
- Public pages load (`/`, `/blogs`, `/thoughts`, `/tags`, `/portfolio`).
- `/admin/login` → log in → create/edit a thought or blog → confirm it PATCHes successfully (real network round-trip to the pooled Postgres, not local).
- A published blog is publicly visible and renders through `ContentReader` (mermaid/callout/math chrome loads — check Phase 4's smoke test covered this already, re-confirm on the real deploy).

## Phase 6 — Hardening (do this before or shortly after going fully live, not blocking Phase 5)

- **RLS**: even though nothing currently depends on it, add baseline policies as defense-in-depth in case a future feature queries Postgres via `supabase-js`/PostgREST directly instead of Drizzle:
  ```sql
  alter table contents enable row level security;
  create policy "public read published" on contents for select
    using (is_published = true);
  -- admin (service-role) bypasses RLS automatically; no write policy needed
  -- for the current server-only write path.
  ```
- **Custom domain**: Cloudflare dashboard → Workers & Pages → your worker → Custom Domains. Point DNS, Cloudflare handles SSL automatically.
- **Backups**: enable Supabase's scheduled Postgres backups (Settings → Database → Backups) — on by default on paid tiers, worth confirming retention window.
- **`.gitignore`**: the `supabase/` directory (`.branches`, `.temp` — local CLI runtime state) is currently untracked but not gitignored. Add it so it doesn't accidentally get committed later.

## Phase 7 — Ongoing deploys

No CI/CD wired up yet (TRD mentions GitHub Actions as the intended path, not built). Until then, deploys are manual: `npm run deploy` from a clean working tree after `npm run lint && npm run typecheck && npm run build` pass locally. Set up GitHub Actions (lint + typecheck + build on PR, `wrangler deploy` on merge to main) when it's worth automating — straightforward addition once the manual flow above is proven a few times.

---

## Rollback

Cloudflare Workers keeps prior deployments — `npx wrangler deployments list` then `npx wrangler rollback <deployment-id>` reverts the Worker instantly without touching the database. Database changes (migrations) are NOT auto-reversible — if a schema change ships alongside a bad deploy, you're rolling back the Worker only; the DB migration stays applied unless you hand-write a down-migration.
