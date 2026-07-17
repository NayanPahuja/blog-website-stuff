# Technical Requirements Document (TRD)
# Personal Knowledge Garden

Companion document to the PRD. Defines architecture, tech stack, data model, and a phased build plan targeting **Cloudflare Workers/Pages** for hosting and **Supabase** for database/auth/storage.

---

## 1. Guiding Technical Principles

Mirroring the product principles:

- **One deployable unit.** Public site + admin panel + APIs ship from a single repo/app — no separate backend service to babysit.
- **Edge-first.** Pages render at the edge for speed; only auth-gated writes hit Supabase.
- **Boring, swappable pieces.** Postgres, S3-compatible storage, standard JWT auth — nothing exotic that locks you in.
- **Content is data, not files.** Thoughts/blogs/projects live in Postgres (not flat markdown files in the repo), so the "thought → publish" workflow is just a status flip, not a rebuild/redeploy.

---

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Hosting | **Cloudflare Workers** (Pages is being folded into Workers — deploy as a Worker with static assets) | Global edge network, generous free tier, native fit with the rest of the stack |
| Framework | **Next.js (App Router)** via `@opennextjs/cloudflare` | Mature file-based routing, Route Handlers double as your API, RSC for fast content pages, one framework for public site + admin |
| Styling | **Tailwind CSS** + `@tailwindcss/typography` for markdown rendering | Fast to build, typography plugin renders long-form articles well |
| Database | **Supabase Postgres** | Relational fit for tags (many-to-many), generous free tier, built-in row-level security |
| ORM | **Drizzle ORM** (over Supabase's connection pooler, `postgres.js` driver) | Edge/Workers-compatible, typed, lightweight — avoids Prisma's Workers friction |
| Auth | **Supabase Auth** (single admin user, email+password or magic link) | You don't need multi-user auth; Supabase Auth is enough and free |
| File/Image storage | **Supabase Storage** (S3-compatible) | Screenshots, blog images, OG images — one bucket, signed uploads from admin |
| Markdown editor | **Tiptap** (or lighter: `react-textarea-autosize` + live preview) | Rich-enough editing without building a WYSIWYG from scratch |
| Markdown rendering | `react-markdown` / MDX + `rehype-pretty-code` (Shiki) | Syntax highlighting, heading IDs for table-of-contents |
| Caching | Cloudflare **Cache API** / KV for published content | Public blog/portfolio pages are cacheable at the edge; thoughts never are |
| Analytics | Simple `page_views` table in Supabase, incremented via a Worker route | No need for a third-party analytics vendor for "views + basic engagement" |
| CI/CD | GitHub Actions → `wrangler deploy` | Standard, free, integrates with Cloudflare |

**Why not split frontend/backend?** Next.js Route Handlers running on the same Worker as your pages give you a single deploy target. Supabase is the only external dependency, reached only for reads/writes (auth, content, images) — everything else stays static/edge-cached.

---

## 3. High-Level Architecture

```
                        ┌─────────────────────────────┐
                        │        Cloudflare Worker      │
                        │  (Next.js via OpenNext build)  │
                        │                               │
   Visitor ───────────▶│  Public routes (SSG/ISR-like  │
                        │  via Cache API):              │
                        │   /            (Home)         │
                        │   /blogs, /blogs/[slug]       │
                        │   /portfolio, /portfolio/[slug]│
                        │                               │
   Admin (you) ───────▶│  /admin/*  (auth-gated,        │
                        │   always dynamic)              │
                        │                               │
                        │  API Route Handlers:           │
                        │   /api/thoughts                │
                        │   /api/blogs                   │
                        │   /api/projects                │
                        │   /api/tags                     │
                        │   /api/upload                    │
                        │   /api/analytics/track            │
                        └───────────┬───────────────────┘
                                    │  HTTPS (service role / RLS-scoped)
                                    ▼
                        ┌─────────────────────────────┐
                        │           Supabase            │
                        │  Postgres  (content + tags)   │
                        │  Auth       (admin session)   │
                        │  Storage    (images, S3-compat)│
                        └─────────────────────────────┘
```

Key decisions baked into this diagram:

- **Public pages are cached at the edge** (Cloudflare Cache API keyed by path + a content-version tag) and only revalidated when the admin publishes/edits — not on every request.
- **Admin and thought-capture routes bypass cache entirely** and always hit Supabase directly, since they must reflect live edits.
- **A single Postgres instance holds everything** (thoughts, blogs, projects, tags) — publishing is a status/table transition, not a data migration.

---

## 4. Data Model

```sql
-- Single admin, so no multi-tenant user table needed beyond Supabase auth.users

create table tags (
  id           uuid primary key default gen_random_uuid(),
  name         text unique not null,
  slug         text unique not null,
  created_at   timestamptz default now()
);

create table thoughts (
  id            uuid primary key default gen_random_uuid(),
  title         text,                -- optional per PRD
  content_md    text not null,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  status        text not null default 'private'
                check (status in ('private','published_as_blog','published_as_project')),
  published_ref uuid            -- FK to blogs.id or projects.id once published
);

create table blogs (
  id             uuid primary key default gen_random_uuid(),
  thought_id     uuid references thoughts(id),  -- origin, nullable if written directly
  title          text not null,
  slug           text unique not null,
  content_md     text not null,
  reading_time   int,                 -- computed on save
  is_published   boolean default false,
  published_at   timestamptz,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

create table projects (
  id                 uuid primary key default gen_random_uuid(),
  thought_id         uuid references thoughts(id),
  name               text not null,
  slug               text unique not null,
  description        text,
  technologies       text[],
  architecture_md     text,
  github_url          text,
  demo_url            text,
  lessons_learned_md  text,
  is_published        boolean default false,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- Tag junctions (tags work across all three content types)
create table thought_tags  (thought_id uuid references thoughts(id) on delete cascade, tag_id uuid references tags(id) on delete cascade, primary key (thought_id, tag_id));
create table blog_tags    (blog_id uuid references blogs(id) on delete cascade, tag_id uuid references tags(id) on delete cascade, primary key (blog_id, tag_id));
create table project_tags (project_id uuid references projects(id) on delete cascade, tag_id uuid references tags(id) on delete cascade, primary key (project_id, tag_id));

create table images (
  id           uuid primary key default gen_random_uuid(),
  storage_path text not null,   -- Supabase Storage path
  alt_text     text,
  created_at   timestamptz default now()
);

create table page_views (
  id         uuid primary key default gen_random_uuid(),
  blog_id    uuid references blogs(id),
  viewed_at  timestamptz default now(),
  referrer   text
);
```

**Row-Level Security (RLS):**
- `thoughts`: no public access at all — only the authenticated admin (via Supabase Auth JWT) can read/write.
- `blogs`, `projects`: public `select` allowed **only where `is_published = true`**; write access restricted to admin.
- `page_views`: insert-only from the edge route handler (via service role), no public read.

---

## 5. Key Workflows

### 5.1 Draft → Publish
1. Admin writes freely in Thought Capture (`thoughts` table, `status = 'private'`).
2. Admin clicks "Publish as Blog" → API creates a row in `blogs` copying `content_md`, computes `reading_time`, sets `thought.status = 'published_as_blog'` and `thought.published_ref`.
3. Editing after publish can happen either on the thought (with a "re-sync to blog" action) or directly on the blog — MVP: **edit the blog directly post-publish**, keep the thought as the historical origin.

### 5.2 Tagging
- Tags created inline while writing (autocomplete against existing `tags`, create-on-the-fly).
- One `tags` table, three junction tables — keeps tag filtering identical across Blogs/Portfolio/Thoughts.

### 5.3 Image Upload
- Admin uploads via `/api/upload` → stored in Supabase Storage bucket `public-images` (for published content) — signed URL returned, inserted into markdown as standard `![alt](url)`.

### 5.4 Analytics
- Lightweight `POST /api/analytics/track` fired from the blog page on load (no third-party script, no cookies needed for basic view counts).
- Admin panel aggregates `page_views` grouped by `blog_id` and date.

### 5.5 Caching Strategy
- Published Blog/Portfolio pages: cached at edge, cache key includes a `content_version` (e.g., `updated_at` timestamp) so a re-publish naturally busts the old cache entry.
- Admin panel and `/api/*` writes: `Cache-Control: no-store`.

---

## 6. Non-Functional Implementation Notes

- **Performance:** Use Next.js static generation for published Blog/Portfolio pages where possible; fall back to edge-cached dynamic rendering for anything that needs to reflect near-real-time publish state.
- **Mobile-friendly editing:** Thought Capture should work as a lightweight textarea+preview on mobile — don't force the full Tiptap toolbar on small screens.
- **Dark mode:** CSS variables + `prefers-color-scheme` default, persisted via a cookie (readable at the edge, avoids flash-of-wrong-theme) rather than localStorage alone.
- **Auth:** Supabase Auth session stored in an HTTP-only cookie, validated in a Next.js middleware for all `/admin/*` and `/api/*` (non-GET-public) routes.

---

## 7. Phased Build Plan

### Phase 0 — Foundations (setup only, no features)
- Init Next.js App Router project, Tailwind, TypeScript.
- Create Supabase project; enable Auth; create admin user manually.
- Set up Drizzle ORM + migrations against Supabase Postgres.
- Set up Cloudflare account, `wrangler.toml`, `@opennextjs/cloudflare` build pipeline.
- CI: GitHub Actions running lint/build/deploy to a Cloudflare preview environment.

**Exit criteria:** "Hello world" Next.js app deployed on a Cloudflare Worker, connected to Supabase, admin can log in.

---

### Phase 1 — Thought Capture (the writing core)
*Per product principle #1: writing starts with a thought, not a blog post.*
- `thoughts` table + RLS.
- Admin-only route `/admin/thoughts`: list, create, edit, delete.
- Markdown editor with autosave (debounced `PATCH` on change).
- Tagging UI on thoughts (create tag inline, attach/detach).

**Exit criteria:** You can write, tag, and revise private thoughts from any device, logged in as admin.

---

### Phase 2 — Draft → Publish Workflow
- `blogs` and `projects` tables + RLS.
- "Publish as Blog" / "Publish as Project" actions from a thought.
- Reading-time computation, slug generation.
- Admin views for editing published Blogs/Projects directly.

**Exit criteria:** A thought can become a published (but not yet publicly visible) blog or project doc.

---

### Phase 3 — Public Blogs Section
- `/blogs` index (list published blogs, tag filter).
- `/blogs/[slug]` detail page: title, date, tags, reading time, rendered markdown, syntax highlighting, auto-generated table of contents for headings.
- Edge caching for these routes.

**Exit criteria:** Published blogs are publicly viewable, fast, and correctly cached.

---

### Phase 4 — Portfolio Section
- `/portfolio` index (grid of projects, tag filter).
- `/portfolio/[slug]` detail page: description, tech stack, architecture overview, screenshots (from Supabase Storage), GitHub/demo links, lessons learned.

**Exit criteria:** Portfolio fully browsable and tag-filterable, publicly.

---

### Phase 5 — Home, Tags, Dark Mode Polish
- Home page: intro, featured blogs, featured projects (manually flagged `is_featured` boolean, simplest option), social links.
- Unified tag browsing UX shared across Blogs and Portfolio.
- Dark/light mode toggle with cookie persistence.

**Exit criteria:** All four sections from the PRD are live and navigable end-to-end.

---

### Phase 6 — Admin Completeness + Analytics
- Image upload flow wired into the markdown editor (drag-drop → Supabase Storage → inline markdown).
- Tag management screen (rename, merge, delete).
- Per-blog analytics view (views over time) in admin.

**Exit criteria:** Admin can run the entire content lifecycle — write, tag, publish, illustrate, and monitor — without touching a database console.

---

### Phase 7 — Hardening & Launch
- RLS audit (confirm thoughts are genuinely private, published-only visibility works).
- Performance pass: Lighthouse on key pages, image optimization, cache-hit verification.
- Custom domain on Cloudflare, SSL, redirects.
- Backups: scheduled Supabase Postgres backup/export.

**Exit criteria:** Production launch on your own domain.

---

## 8. Future Features (post-MVP backlog)

Roughly ordered by how naturally they extend the current architecture:

1. **RSS feed** for Blogs — trivial once content is in Postgres.
2. **Full-text search** across thoughts/blogs/projects — Postgres `tsvector` is enough at this scale, no need for a separate search service.
3. **OG image generation** per blog/project (`@vercel/og`-style, works fine on Workers) for better social sharing.
4. **Thought version history** — append-only edit log rather than overwrite, so nothing is ever truly lost.
5. **"Related content"** — surfaced via shared tags, no ML needed initially.
6. **Backlinks / graph view** — Zettelkasten-style linking between thoughts (`[[wiki-links]]`) with a visual graph, since the data model already supports arbitrary relations via a join table.
7. **Comments** — likely via a lightweight third-party (e.g., giscus on GitHub Discussions) rather than building your own to preserve simplicity.
8. **Newsletter** — simple double opt-in table + integration with an email provider (e.g., Resend) when you're ready to notify readers of new posts.
9. **AI-assisted tagging/summarization** — call the Anthropic API from a Route Handler to suggest tags or a TL;DR for a thought before publishing.
10. **PWA / offline thought capture** — service worker + local queue so you can jot ideas without connectivity, syncing to Supabase when back online.
11. **Public API** — read-only JSON endpoints for blogs/projects if you ever want to power a second surface (e.g., a terminal-based reader) without duplicating the CMS.
12. **i18n** — only if genuinely needed; adds real complexity, so deliberately deferred.

---

## 9. Risks & Trade-offs to Keep in Mind

- **Cloudflare Workers + Next.js via OpenNext** is actively maintained but younger than Vercel's native support — pin versions and test builds after upgrades.
- **Supabase connection pooling from Workers**: use the pooled connection string (transaction mode) rather than a direct Postgres connection, since Workers are short-lived and can exhaust direct connections quickly.
- **Cache invalidation bugs** are the most likely source of "I published but it's not showing" — the `content_version`-keyed cache key is there specifically to make this predictable.