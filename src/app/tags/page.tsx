import type { Metadata } from "next";
import { db, schema } from "@/db/client";
import { asc } from "drizzle-orm";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tags — pkg/nayan",
};

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  let tags: Array<{ id: string; name: string; slug: string }> = [];

  try {
    tags = await db.select().from(schema.tags).orderBy(asc(schema.tags.name));
  } catch {}

  return (
    <div className="py-8 space-y-6">
      <h1 className="text-[var(--fs-h1,clamp(40px,7vw,48px))] font-semibold leading-[1.1] tracking-[-0.06em] text-[var(--text)]">
        Tags
      </h1>
      {tags.length === 0 && (
        <p className="text-[var(--muted)]">No tags yet.</p>
      )}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Link
            key={tag.id}
            href={`/tags/${tag.slug}`}
            className="inline-flex items-center rounded-md border border-[var(--border)] bg-[var(--code-bg)] px-3 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)] transition-colors"
          >
            {tag.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
