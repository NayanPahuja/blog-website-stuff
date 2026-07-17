import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();

  return (
    <div className="py-8 space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Admin</h1>
      <nav className="space-y-3">
        <Link
          href="/admin/thoughts"
          className="block rounded-lg border border-[var(--border)] px-4 py-3 text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
        >
          <span className="font-medium">Thoughts</span>
          <p className="text-sm text-[var(--muted)] mt-0.5">Write, tag, and revise private thoughts</p>
        </Link>
        <Link
          href="/admin/blogs"
          className="block rounded-lg border border-[var(--border)] px-4 py-3 text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
        >
          <span className="font-medium">Blog Posts</span>
          <p className="text-sm text-[var(--muted)] mt-0.5">Manage published and draft blog posts</p>
        </Link>
      </nav>
    </div>
  );
}
