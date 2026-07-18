import { NextResponse, type NextRequest } from "next/server";
import { db, schema } from "@/db/client";
import { requireAdmin } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import slug from "slug";

/**
 * Publishing is an in-place type transition, not a copy: the thought's row in
 * `contents` becomes a blog/project row (same id, same content_md/tags),
 * gains a slug, and gets a `blog_details`/`project_details` extension row.
 * `is_published` is untouched here — it stays a draft until explicitly
 * published from the blog/project editor.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { type } = await request.json();

    if (type !== "blog" && type !== "project") {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const [thought] = await db
      .select()
      .from(schema.contents)
      .where(and(eq(schema.contents.id, id), eq(schema.contents.contentType, "thought")));

    if (!thought) {
      return NextResponse.json({ error: "Thought not found" }, { status: 404 });
    }

    if (!thought.title?.trim()) {
      return NextResponse.json(
        { error: "Title is required for publishing" },
        { status: 400 },
      );
    }

    const baseSlug = slug(thought.title.trim().toLowerCase());
    let finalSlug = baseSlug;
    let counter = 1;
    while (true) {
      const [existing] = await db
        .select({ id: schema.contents.id })
        .from(schema.contents)
        .where(eq(schema.contents.slug, finalSlug))
        .limit(1);

      if (!existing) break;
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    if (type === "blog") {
      const wordCount = thought.contentMd.split(/\s+/).length;
      const readingTime = Math.ceil(wordCount / 200);

      await db
        .update(schema.contents)
        .set({ contentType: "blog", slug: finalSlug, updatedAt: new Date() })
        .where(eq(schema.contents.id, id));

      await db.insert(schema.blogDetails).values({ contentId: id, readingTime });

      return NextResponse.json({ id, slug: finalSlug });
    } else {
      await db
        .update(schema.contents)
        .set({ contentType: "project", slug: finalSlug, updatedAt: new Date() })
        .where(eq(schema.contents.id, id));

      await db.insert(schema.projectDetails).values({ contentId: id });

      return NextResponse.json({ id, slug: finalSlug });
    }
  } catch (err) {
    console.error("[publish] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
