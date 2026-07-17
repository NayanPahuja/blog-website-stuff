import Link from "next/link";
import { db, schema } from "@/db/client";
import { requireAdmin } from "@/lib/auth";
import { desc } from "drizzle-orm";
import { ThoughtActions } from "./thought-actions";

export const dynamic = "force-dynamic";

export default async function AdminThoughtsPage() {
  await requireAdmin();

  const thoughts = await db
    .select()
    .from(schema.thoughts)
    .orderBy(desc(schema.thoughts.updatedAt));

  return (
    <div className="py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Thoughts</h1>
        <Link
          href="/admin/thoughts/new"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface)] hover:border-[var(--border-strong)] transition-colors"
          aria-label="New thought"
          title="New thought"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/></svg>
        </Link>
      </div>

      {thoughts.length === 0 && (
        <p className="text-[var(--muted)]">No thoughts yet. Create your first one.</p>
      )}

      <div className="space-y-1">
        {thoughts.map((thought) => (
          <div
            key={thought.id}
            className="flex items-center justify-between rounded-lg border border-[var(--border)] px-4 py-3 hover:bg-[var(--surface)] transition-colors"
          >
            <Link
              href={`/admin/thoughts/${thought.id}`}
              className="flex-1 min-w-0"
            >
              <p className="font-medium text-[var(--text)] truncate">
                {thought.title || "Untitled"}
              </p>
              <p className="text-xs text-[var(--faint)] mt-0.5">
                {new Date(thought.updatedAt).toLocaleDateString()} &middot;{" "}
                <span className="capitalize">{thought.status.replace(/_/g, " ")}</span>
                &middot; {thought.contentMd.length} chars
              </p>
            </Link>
            <ThoughtActions id={thought.id} />
          </div>
        ))}
      </div>
    </div>
  );
}
