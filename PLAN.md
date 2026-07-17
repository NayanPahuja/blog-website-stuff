# Personal Knowledge Garden — Phased Implementation Plan

Built from `PRD.md` + `TRD.md` (in the repo root). All code lives under `code/`.
Git history is driven commit-by-commit, one logical unit per commit.
Editor choice: **Tiptap**.

---

## Stack (from TRD §2, locked)

| Layer | Choice |
|---|---|
| Hosting | Cloudflare Workers (Next.js via `@opennextjs/cloudflare`) |
| Framework | Next.js App Router + TypeScript (`src/` dir) |
| Styling | Tailwind CSS v4 + `@tailwindcss/typography` |
| DB | Supabase Postgres |
| ORM | Drizzle (`postgres.js` driver, pooled connection) |
| Auth | Supabase Auth (`@supabase/ssr`, HTTP-only cookie, single admin) |
| Storage | Supabase Storage (S3-compatible, `public-images` bucket) |
| Editor | Tiptap (starter-kit + link + placeholder) |
| Markdown render | `react-markdown` + `rehype-pretty-code` (Shiki) |
| Caching | Cloudflare Cache API keyed by `content_version` |
| CI/CD | GitHub Actions → `wrangler deploy` |

---

## Target Directory Structure (under `code/`)

```
code/
├── .github/workflows/ci.yml
├── PLAN.md · README.md · .env.example · .gitignore
├── package.json · tsconfig.json · next.config.ts
├── postcss.config.mjs · eslint.config.mjs
├── drizzle.config.ts
├── open-next.config.ts
├── wrangler.jsonc
├── drizzle/                       # generated migrations (committed)
└── src/
    ├── middleware.ts              # auth gate for /admin & non-GET /api
    ├── db/
    │   ├── schema.ts             # Drizzle schema = TRD §4 tables
    │   └── client.ts             # edge Drizzle client (pooled conn)
    ├── lib/
    │   ├── supabase/server.ts    # cookie-based server client
    │   ├── supabase/admin.ts     # service-role client (writes)
    │   ├── auth.ts               # getSession / requireAdmin
    │   ├── slug.ts · reading-time.ts
    │   ├── cache.ts              # content_version-keyed edge cache
    │   └── theme.ts              # dark-mode cookie helper
    ├── components/
    │   ├── ui/                   # Button, Input, Card primitives
    │   ├── layout/               # Header, Footer, Nav, ThemeToggle
    │   ├── editor/               # Tiptap MarkdownEditor (Phase 1)
    │   ├── tags/                 # TagInput, TagBadge, TagFilter
    │   └── markdown/             # Renderer + ToC (Phase 3)
    └── app/
        ├── layout.tsx · globals.css · page.tsx (Home, Phase 5)
        ├── blogs/{page,[slug]/page}.tsx        (Phase 3)
        ├── portfolio/{page,[slug]/page}.tsx    (Phase 4)
        ├── admin/{layout,page}.tsx + thoughts/ blogs/ projects/ tags/ analytics/ login/
        └── api/{thoughts,blogs,projects,tags,upload,analytics/track}/route.ts
```

---

## Cross-Cutting Conventions

- **One commit per logical unit**, conventional-commit messages (`feat:`, `chore:`, `fix:`).
- **Env secrets never committed.** `.env.example` documents names; real values live in `wrangler` secrets / CI.
- **Drizzle migrations are the source of truth** — schema changes always ship with a generated `.sql` migration in `drizzle/`.
- **RLS is mandatory** on every table (TRD §4): `thoughts` = admin-only; `blogs`/`projects` = public read where `is_published`; `page_views` = insert-only.
- **Public routes cacheable** (`Cache-Control` + Cache API); `/admin/*` and non-GET `/api/*` = `no-store`.

---

## Phase 0 — Foundations (scaffolding, no features)

**Exit criteria:** Hello-world app builds, lint+typecheck pass in CI, Drizzle schema compiles, `requireAdmin` middleware compiles. (Live deploy + actual login require Supabase/Cloudflare accounts + env — wired and ready, verified locally.)

1. Repo init + plan/readme/gitignore docs → `chore: init repo, add plan and project docs`
2. Scaffold Next.js App Router + Tailwind + TS → `chore: scaffold next.js app router + tailwind + ts`
3. Install core dependencies → `chore: add runtime + dev dependencies`
4. Drizzle schema + client + initial migration → `feat(db): add drizzle schema + initial migration`
5. Supabase clients + auth scaffolding + middleware + login stub → `feat(auth): supabase ssr clients + admin middleware + login stub`
6. OpenNext + wrangler config + npm scripts + .env.example → `chore(deploy): add opennext + wrangler config, npm scripts`
7. CI workflow (lint/typecheck/build) → `ci: add lint/typecheck/build workflow`
8. Hello-world home wired to supabase+drizzle + local verify → `feat: hello-world home page wired to supabase+drizzle`

---

## Phase 1 — Thought Capture (writing core)

**Exit criteria:** Write, tag, revise private thoughts from any device as admin.

- `thoughts` migration + RLS policy (admin-only).
- `/api/thoughts` CRUD route handlers (zod-validated, `requireAdmin`).
- `/admin/thoughts` list + `[id]` edit pages.
- **Tiptap editor** (`components/editor/MarkdownEditor.tsx`): starter-kit + link + placeholder; **autosave** = debounced `PATCH` on content change; serialize to markdown.
- Tag input UI (autocomplete existing tags, create-on-the-fly) + `thought_tags` junction writes.
- Mobile: editor collapses toolbar, keeps core formatting.

---

## Phase 2 — Draft → Publish Workflow

**Exit criteria:** A thought can become a published (not-yet-public) blog or project doc.

- `blogs`, `projects` migrations + RLS (public read where `is_published`).
- `src/lib/slug.ts` (unique slug gen), `src/lib/reading-time.ts` (computed on save).
- "Publish as Blog" / "Publish as Project" actions from a thought → copy `content_md`, set `thought.status` + `published_ref`, create blog/project row.
- Admin edit views for published blogs/projects (edit-in-place per TRD §5.1 MVP).
- `blog_tags` / `project_tags` junctions + tag UI reused.

---

## Phase 3 — Public Blogs Section

**Exit criteria:** Published blogs public, fast, correctly cached.

- `/blogs` index: list published, tag filter.
- `/blogs/[slug]`: title, date, tags, reading time, `react-markdown` + `rehype-pretty-code`, auto ToC from headings (`rehype-slug` IDs).
- `src/lib/cache.ts`: Cache API keyed by path + `content_version` (`updated_at`); revalidates on publish/edit.
- `POST /api/analytics/track` (insert into `page_views`, fired client-side, no cookies).

---

## Phase 4 — Portfolio Section

**Exit criteria:** Portfolio browsable + tag-filterable publicly.

- `/portfolio` grid + tag filter.
- `/portfolio/[slug]`: description, tech stack, architecture md, screenshots (Supabase Storage URLs), github/demo links, lessons-learned md.
- Edge caching reused from Phase 3.

---

## Phase 5 — Home, Unified Tags, Dark Mode

**Exit criteria:** All four PRD sections live and navigable.

- Home: intro, featured blogs/projects (add `is_featured` bool via migration), social links.
- Shared tag-browsing UX across blogs/portfolio.
- Dark mode: CSS variables + `prefers-color-scheme` default, **cookie-persisted** (`src/lib/theme.ts`, read at edge to avoid flash), `ThemeToggle`.

---

## Phase 6 — Admin Completeness + Analytics

**Exit criteria:** Admin runs full content lifecycle without a DB console.

- Image upload: drag-drop in Tiptap → `/api/upload` → Supabase Storage → inline markdown `![](signedUrl)`.
- Tag management screen: rename, merge, delete.
- Per-blog analytics view (views over time, aggregated from `page_views`).

---

## Phase 7 — Hardening & Launch

**Exit criteria:** Production launch on custom domain.

- RLS audit (thoughts private; published-only visibility).
- Lighthouse pass, image optimization, cache-hit verification.
- CI deploy step (`wrangler deploy`), custom domain + SSL + redirects.
- Scheduled Supabase Postgres backup/export.

---

## Notes / Risks (from TRD §9)

- **OpenNext + Next.js 16** is actively maintained but younger than Vercel's native support — pin versions and test builds after upgrades.
- **Supabase connection pooling from Workers**: use the pooled (transaction-mode) connection string; direct connections exhaust quickly from short-lived Workers.
- **Cache invalidation** is the most likely source of "published but not showing" — the `content_version`-keyed cache key makes it predictable.
