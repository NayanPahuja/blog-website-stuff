import { NextResponse, type NextRequest } from "next/server";
import { db, schema } from "@/db/client";
import { requireAdmin } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const { title, slug, contentMd, readingTime, isPublished, tagIds } = await request.json();

    if (!title?.trim() || !slug?.trim() || !contentMd?.trim()) {
      return NextResponse.json(
        { error: "Title, slug, and content are required" },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const [existing] = await db
      .select()
      .from(schema.blogs)
      .where(eq(schema.blogs.slug, slug.trim()));

    if (existing) {
      return NextResponse.json(
        { error: "A blog with this slug already exists" },
        { status: 400 }
      );
    }

    const [blog] = await db
      .insert(schema.blogs)
      .values({
        title: title.trim(),
        slug: slug.trim(),
        contentMd: contentMd.trim(),
        readingTime: readingTime || null,
        isPublished: isPublished || false,
        isFeatured: false,
        publishedAt: isPublished ? new Date() : null,
      })
      .returning();

    // Add tags
    if (tagIds && tagIds.length > 0) {
      await db.insert(schema.blogTags).values(
        tagIds.map((tagId: string) => ({
          blogId: blog.id,
          tagId,
        }))
      );
    }

    return NextResponse.json(blog);
  } catch (err) {
    console.error("[blogs POST] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await requireAdmin();
    const blogs = await db.select().from(schema.blogs).orderBy(desc(schema.blogs.updatedAt));
    return NextResponse.json(blogs);
  } catch (err) {
    console.error("[blogs GET] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
