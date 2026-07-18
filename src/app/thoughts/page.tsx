import { db, schema } from "@/db/client";
import { desc, eq, inArray } from "drizzle-orm";
import { ContentListItem } from "@/components/content/content-list-item";

export const dynamic = "force-dynamic";

export default async function ThoughtsPage() {
  const thoughts = await db
    .select({
      id: schema.contents.id,
      title: schema.contents.title,
      description: schema.contents.description,
      contentMd: schema.contents.contentMd,
      updatedAt: schema.contents.updatedAt,
    })
    .from(schema.contents)
    .where(eq(schema.contents.contentType, "thought"))
    .orderBy(desc(schema.contents.updatedAt));

  const thoughtIds = thoughts.map((t) => t.id);
  const tagsByThought: Record<string, Array<{ name: string; slug: string }>> = {};

  if (thoughtIds.length > 0) {
    const rows = await db
      .select({
        contentId: schema.contentTags.contentId,
        name: schema.tags.name,
        slug: schema.tags.slug,
      })
      .from(schema.contentTags)
      .where(inArray(schema.contentTags.contentId, thoughtIds))
      .innerJoin(schema.tags, eq(schema.contentTags.tagId, schema.tags.id));
    for (const row of rows) {
      if (!tagsByThought[row.contentId]) tagsByThought[row.contentId] = [];
      tagsByThought[row.contentId].push({ name: row.name, slug: row.slug });
    }
  }

  return (
    <div className="py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[var(--fs-h1,clamp(40px,7vw,48px))] font-semibold leading-[1.1] tracking-[-0.06em] text-[var(--text)]">
          Thoughts
        </h1>
        <p className="text-sm text-[var(--muted)]">
          {thoughts.length} {thoughts.length === 1 ? "thought" : "thoughts"}
        </p>
      </div>

      {thoughts.length === 0 && (
        <p className="text-[var(--muted)]">No thoughts published yet.</p>
      )}

      <div className="post-list">
        {thoughts.map((thought) => {
          const excerpt =
            thought.description ||
            thought.contentMd.slice(0, 200) + (thought.contentMd.length > 200 ? "..." : "");
          return (
            <ContentListItem
              key={thought.id}
              href={`/thoughts/${thought.id}`}
              title={thought.title || "Untitled thought"}
              date={thought.updatedAt}
              excerpt={excerpt}
              tags={tagsByThought[thought.id]}
            />
          );
        })}
      </div>
    </div>
  );
}
