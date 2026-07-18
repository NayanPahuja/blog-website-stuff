import { NextResponse, type NextRequest } from "next/server";
import { db, schema } from "@/db/client";
import { requireAdmin } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const { title, slug, contentMd, readingTime, isPublished, tagIds } = await request.json();

    if (!title?.trim() || !slug?.trim() || !contentMd?.trim()) {
      return NextResponse.json(
        { error: "Title, slug, and content are required" },
        { status: 400 },
      );
    }

    const [existing] = await db
      .select({ id: schema.contents.id })
      .from(schema.contents)
      .where(eq(schema.contents.slug, slug.trim()));

    if (existing) {
      return NextResponse.json(
        { error: "A blog with this slug already exists" },
        { status: 400 },
      );
    }

    // published_at is only ever set on the false -> true transition, never at
    // creation, so a blog created already-published still starts with it null.
    const [content] = await db
      .insert(schema.contents)
      .values({
        contentType: "blog",
        title: title.trim(),
        slug: slug.trim(),
        contentMd: contentMd.trim(),
        isPublished: isPublished || false,
        isFeatured: false,
      })
      .returning();

    const [details] = await db
      .insert(schema.blogDetails)
      .values({ contentId: content.id, readingTime: readingTime || null })
      .returning();

    if (tagIds && tagIds.length > 0) {
      await db.insert(schema.contentTags).values(
        tagIds.map((tagId: string) => ({
          contentId: content.id,
          tagId,
        })),
      );
    }

    return NextResponse.json({ ...content, readingTime: details.readingTime });
  } catch (err) {
    console.error("[blogs POST] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    await requireAdmin();
    const blogs = await db
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
      .where(eq(schema.contents.contentType, "blog"))
      .orderBy(desc(schema.contents.updatedAt));
    return NextResponse.json(blogs);
  } catch (err) {
    console.error("[blogs GET] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
