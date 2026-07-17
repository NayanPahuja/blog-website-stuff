import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { requireAdmin } from "@/lib/auth";
import { desc } from "drizzle-orm";

export async function GET() {
  await requireAdmin();
  const thoughts = await db
    .select()
    .from(schema.thoughts)
    .orderBy(desc(schema.thoughts.createdAt));
  return NextResponse.json(thoughts);
}

export async function POST(request: Request) {
  await requireAdmin();
  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim() : null;
  const description = typeof body.description === "string" ? body.description.trim() : null;
  const contentMd = typeof body.contentMd === "string" ? body.contentMd.trim() : "";
  const tagIds = Array.isArray(body.tagIds) ? body.tagIds : [];

  if (!contentMd) {
    return NextResponse.json({ error: "Content is required." }, { status: 400 });
  }

  const [thought] = await db
    .insert(schema.thoughts)
    .values({ 
      title: title || null, 
      description: description || null,
      contentMd 
    })
    .returning();

  // Add tags
  if (tagIds.length > 0) {
    await db.insert(schema.thoughtTags).values(
      tagIds.map((tagId: string) => ({
        thoughtId: thought.id,
        tagId,
      }))
    );
  }

  return NextResponse.json(thought, { status: 201 });
}
