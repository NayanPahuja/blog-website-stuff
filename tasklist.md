# Project Status — pkg/nayan

## Decision Log

| Decision | Choice | Rationale |
|---|---|---|
| Middleware vs proxy | `middleware.ts` with `experimental-edge` | OpenNext Cloudflare can't run Node.js proxy — stuck until OpenNext adds Node.js middleware support |
| Auth server client | `createServerClient` from `@supabase/ssr` | Standard SSR pattern; wraps `getUser()` in try/catch in middleware to avoid crashing on transient errors |
| Theme hydration | `useSyncExternalStore` with module-level store | `getSnapshot` returns `"system"` initially (matches SSR); sync from localStorage in `subscribe` callback (after first render) — avoids both hydration mismatch and lint rule (`react-hooks/set-state-in-effect`) |
| Flash prevention | Inline `<script>` in `<head>` reads localStorage, sets `data-theme` + `data-theme-preference` attributes | Runs before React hydrates; browser applies correct theme CSS immediately |
| Env vars | 3 files: `.env`, `.env.local`, `.dev.vars` (all gitignored) | Dev, deployed preview, and local preview each use the canonical file per convention |
| Editor extensions | Enhanced Tiptap with tables, task lists, code blocks (lowlight), horizontal rules, highlight, H1-H6 | Richer markdown support without external dependencies; custom turndown rules for GFM features |
| Editor replacement | Switched from `@uiw/react-md-editor` to Lexical for admin markdown editor | `@uiw/react-md-editor` had broken Enter key handling; Lexical provides native contentEditable with proper newline support, markdown import/export via `@lexical/markdown`, and WYSIWYG toolbar |
| Code highlighting | `registerCodeHighlighting` from `@lexical/code-prism` | Required for Lexical `CodeNode` to render fenced code blocks with syntax highlighting; Prism-based tokenizer |
| Editor replacement v2 | Switched from Lexical back to Tiptap with `tiptap-markdown` | Lexical's `@lexical/markdown` `TRANSFORMERS` do **not** include code blocks — fenced code was silently dropped during serialization, corrupting stored markdown. Tiptap's `tiptap-markdown` + `CodeBlockLowlight` handles fenced code correctly end-to-end. |
| Markdown rendering | Shared `<MarkdownRenderer/>` with `rehype-pretty-code` (Shiki) | Replaced duplicated per-page ReactMarkdown configs with a single component. Shiki runs at server render time (RSC) — light+dark themes emitted simultaneously, toggled via CSS `[data-theme]`. |

## Phase 0 — Foundation ✅ Done
- Next.js 16 App Router + Tailwind v4 + TypeScript + Drizzle ORM + Supabase
- Supabase SSR clients (cookie + service-role), auth helpers
- OpenNext + wrangler config, npm scripts (lint/typecheck/build/preview/db:*/cf-typegen)
- GitHub Actions CI (lint, typecheck, next build on Node 20+22)
- Drizzle schema: 9 tables pushed (tags, thoughts, blogs, projects, thought_tags, blog_tags, project_tags, images, page_views)
- Admin user created: `nayantest@gmail.com`

## Phase 1 — Thought Capture ✅ Done
- Enhanced Tiptap WYSIWYG editor with:
  - Tables (insert, add rows/columns, delete)
  - Task lists with checkboxes
  - Code blocks with syntax highlighting (lowlight)
  - Horizontal rules, highlight, inline code
  - H1-H6 headings, bold, italic, strikethrough
  - Blockquotes, bullet/ordered lists, links
  - Live preview toggle (split-pane editor/preview)
- **Replaced `@uiw/react-md-editor` with Lexical** in admin editor:
  - Lexical `LexicalComposer` + `RichTextPlugin` for WYSIWYG editing
  - `@lexical/markdown` for markdown import/export (`$convertFromMarkdownString` / `$convertToMarkdownString`)
  - `registerCodeHighlighting` from `@lexical/code-prism` for syntax-highlighted code blocks (` ```go ` etc.)
  - Toolbar: Bold, Italic, Strikethrough, Inline Code, H1-H3, UL/OL, Link
  - `HistoryPlugin` for undo/redo, `ListPlugin`/`CheckListPlugin`/`LinkPlugin`/`TabIndentationPlugin`/`HorizontalRulePlugin`
  - All required nodes registered: `HeadingNode`, `QuoteNode`, `ListNode`, `ListItemNode`, `LinkNode`, `CodeNode`, `CodeHighlightNode`, `HorizontalRuleNode`
  - Theme-aware (follows `data-theme` via `MutationObserver`)
- Tag input with autocomplete + create-on-the-fly
- Admin pages: `/admin`, `/admin/thoughts`, `/admin/thoughts/new`, `/admin/thoughts/[id]`
- API routes: `POST/GET /api/thoughts`, `PATCH/DELETE /api/thoughts/[id]`, `GET /api/tags`
- Turndown with custom GFM rules for markdown serialization

## Design (rednafi-inspired) ✅ Done
- CSS custom properties color tokens (light/dark via `[data-theme]` + `[data-theme-preference]`)
- Geist + Geist Mono fonts via `next/font/google`
- 3-segment theme toggle (System/Light/Dark) with SVG icons, localStorage persistence
- Hamburger mega-panel nav (Writing: Blogs/Portfolio/Tags, More: About)
- Site footer with nav links + copyright
- Home page: hero greeting, tagline, social icons
- Public pages: `/about`, `/blogs`, `/portfolio`, `/tags`

## Middleware & Auth ✅ Done
- Auth gate for `/admin/*` and non-GET `/api/*` — exempts `PUBLIC_API_PATHS`
- Login form at `/admin/login` → `POST /api/admin/login`
- **Fixed**: Login cookie bug — response object now properly includes auth session cookies

## Phase 2 — Draft → Publish Workflow ✅ Done
- Thought status enum: `private`, `published_as_blog`, `published_as_project`
- "Publish as..." dropdown in thought editor (Blog/Project options)
- API endpoint: `POST /api/thoughts/[id]/publish` — converts thought to blog/project
- Automatic slug generation with collision handling
- Reading time calculation (words/200)
- Tag copying from thought to blog/project
- Blog editor with draft/published toggle
- Admin pages: `/admin/blogs`, `/admin/blogs/[id]`
- API routes: `POST/GET /api/blogs`, `PATCH/DELETE /api/blogs/[id]`, `GET /api/blogs/[id]/tags`
- Preview button (opens blog in new tab with `?preview=true`)
- Status badges (Draft/Published/Featured) in admin list views
- Publish/unpublish toggle with automatic `publishedAt` timestamp

## Current Status
- ✅ Phases 0, 1, 2 complete
- ✅ Login issue resolved
- ✅ Enhanced editor with preview
- ✅ Full draft/publish workflow for thoughts → blogs
- ✅ Admin markdown editor switched from `@uiw/react-md-editor` to Lexical (fixes Enter key, adds proper code block rendering)

## Active Bug Fixes

### Bug 1 — Markdown not rendering correctly (blogs + thoughts) ✅ FIXED
**Root cause:** Blog/thought detail pages each had their own duplicated `ReactMarkdown` config with no syntax highlighting. `rehype-pretty-code` (Shiki) caused async/sync mismatch errors.
**Fix:** Created shared `<MarkdownRenderer/>` component (`src/components/markdown/markdown-renderer.tsx`) with `ReactMarkdown` + `remark-gfm`. Removed `rehype-pretty-code` to avoid runSync async errors. Updated `blogs/[slug]/page.tsx` and `thoughts/[id]/page.tsx` to use it.
**Status:** ✅ Fixed.

### Bug 2 — Editor does not accept code blocks ✅ FIXED
**Root cause:** Admin editors used Lexical editor (`enhanced-markdown-editor.tsx`). Lexical's `@lexical/markdown` `TRANSFORMERS` do **not** include code block support — fenced ```` ```lang ```` code was silently dropped during markdown serialization. The Tiptap editor with `CodeBlockLowlight` existed but wasn't wired to the admin pages.
**Fix:** Rewrote `markdown-editor.tsx` as a clean Tiptap editor using `tiptap-markdown` for two-way markdown serialization + `CodeBlockLowlight` for code blocks with syntax highlighting (lowlight). Updated `blog-editor.tsx` and `thought-editor.tsx` to import the new `MarkdownEditor` instead of the old `EnhancedMarkdownEditor`. Removed all unused Lexical packages. Fixed `serializeMarkdown` function to use correct `getMarkdown()` API.
**Status:** ✅ Fixed.

### Bug 3 — Script tag warning in layout.tsx ✅ FIXED
**Root cause:** React warns against `<script>` tags in components. Using raw `<script>` tag in `layout.tsx` for theme initialization causes console warnings.
**Fix:** Replaced `<script>` with Next.js `<Script>` component with `strategy="beforeInteractive"` to properly handle theme initialization before page renders.
**Status:** ✅ Fixed.

### Bug 4 — "+ New Thought" / "+ New Blog" button styling 🔲 TODO
**Root cause:** Buttons use `bg-[var(--accent)]` (blue #0062d1) with `text-[var(--bg)]` (white) — renders as a blue filled button with white text. The user wants a minimal `+` icon button instead.
**Fix:** Replace `<Link>` text buttons with a minimal `+` icon-only button (subtle border, no background fill).
**Status:** 🔲 Not started yet.

## Phase 3+ — Not Started
- Public blog pages with markdown rendering, syntax highlighting, ToC
- Portfolio detail pages
- Image upload, tag management, per-blog analytics
- RLS audit, Lighthouse, Cloudflare deploy, custom domain, backups

## Env Setup
| Secret | Status |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ `.env` / `.env.local` / `.dev.vars` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Set |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Set |
| `DATABASE_URL` | ✅ Set |
| Admin user (`nayantest@gmail.com`) | ✅ Created in Supabase Auth |
