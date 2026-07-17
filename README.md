# Personal Knowledge Garden

A minimal personal website that combines a technical blog, portfolio, and private writing workspace into a single experience. Built per the [PRD](../PRD.md) and [TRD](../TRD.md).

The product encourages **writing first, organizing later** — capture ideas as private "thoughts," then publish them as blogs or project write-ups when ready. Tags are the only organizational system.

> See [PLAN.md](./PLAN.md) for the full phased build plan and current progress.

---

## Tech stack

- **Next.js 16** (App Router, RSC) + TypeScript
- **Tailwind CSS v4**
- **Cloudflare Workers** via `@opennextjs/cloudflare`
- **Supabase** — Postgres, Auth (single admin), Storage (images)
- **Drizzle ORM** (pooled `postgres.js` driver)
- **Tiptap** markdown editor · `react-markdown` + `rehype-pretty-code` for rendering

---

## Getting started (local)

### Prerequisites

- Node.js 20+ (developed on Node 24)
- A Supabase project (URL + anon/service-role keys + pooled Postgres connection string)
- A Cloudflare account (only needed for `preview`/deploy)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
#   fill in SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL

# 3. Push the database schema
npm run db:push

# 4. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Useful scripts

| Script | What it does |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run preview` | OpenNext build + `wrangler dev` (Cloudflare Workers locally) |
| `npm run db:generate` | Generate a Drizzle migration from schema changes |
| `npm run db:push` | Push schema to the database |
| `npm run db:studio` | Drizzle Studio (browse/edit DB) |

---

## Project layout

Code lives entirely under `src/`:

- `src/db/` — Drizzle schema + edge DB client
- `src/lib/` — Supabase clients, auth, caching, theme, helpers
- `src/components/` — UI primitives, layout, editor (Tiptap), tags, markdown
- `src/app/` — App Router pages (public site + `/admin/*`) and `/api/*` route handlers
- `drizzle/` — generated migrations (committed)

See [PLAN.md](./PLAN.md) for the section-by-section breakdown.
