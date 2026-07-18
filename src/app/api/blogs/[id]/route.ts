import { NextResponse, type NextRequest } from "next/server";
import { db, schema } from "@/db/client";
import { requireAdmin } from "@/lib/auth";
import { and, eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const [blog] = await db
      .select({
        id: schema.contents.id,
        title: schema.contents.title,
        slug: schema.contents.slug,
        contentMd: schema.contents.contentMd,
        isPublished: schema.contents.isPublished,
        isFeatured: schema.contents.isFeatured,
        publishedAt: schema.contents.publishedAt,
        createdAt: schema.contents.createdAt,
        updatedAt: schema.contents.updatedAt,
        readingTime: schema.blogDetails.readingTime,
      })
      .from(schema.contents)
      .innerJoin(schema.blogDetails, eq(schema.blogDetails.contentId, schema.contents.id))
      .where(and(eq(schema.contents.id, id), eq(schema.contents.contentType, "blog")));

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json(blog);
  } catch (err) {
    console.error("[blog GET] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { title, slug, contentMd, readingTime, isPublished, isFeatured, tagIds } =
      await request.json();

    const [current] = await db
      .select()
      .from(schema.contents)
      .where(and(eq(schema.contents.id, id), eq(schema.contents.contentType, "blog")));

    if (!current) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title.trim();
    if (slug !== undefined) {
      const [existing] = await db
        .select({ id: schema.contents.id })
        .from(schema.contents)
        .where(eq(schema.contents.slug, slug.trim()));

      if (existing && existing.id !== id) {
        return NextResponse.json(
          { error: "A blog with this slug already exists" },
          { status: 400 },
        );
      }
      updateData.slug = slug.trim();
    }
    if (contentMd !== undefined) updateData.contentMd = contentMd.trim();
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;

    // published_at is only ever set on the false -> true transition.
    if (isPublished !== undefined) {
      updateData.isPublished = isPublished;
      if (isPublished && !current.isPublished) {
        updateData.publishedAt = new Date();
      }
    }

    const [blog] = await db
      .update(schema.contents)
      .set(updateData)
      .where(eq(schema.contents.id, id))
      .returning();

    if (readingTime !== undefined) {
      await db
        .update(schema.blogDetails)
        .set({ readingTime })
        .where(eq(schema.blogDetails.contentId, id));
    }

    if (tagIds !== undefined) {
      await db.delete(schema.contentTags).where(eq(schema.contentTags.contentId, id));

      if (tagIds.length > 0) {
        await db.insert(schema.contentTags).values(
          tagIds.map((tagId: string) => ({
            contentId: id,
            tagId,
          })),
        );
      }
    }

    const [details] = await db
      .select({ readingTime: schema.blogDetails.readingTime })
      .from(schema.blogDetails)
      .where(eq(schema.blogDetails.contentId, id));

    return NextResponse.json({ ...blog, readingTime: details?.readingTime ?? null });
  } catch (err) {
    console.error("[blog PATCH] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;

    await db
      .delete(schema.contents)
      .where(and(eq(schema.contents.id, id), eq(schema.contents.contentType, "blog")));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[blog DELETE] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
