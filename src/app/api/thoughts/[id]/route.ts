import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;

  const [thought] = await db
    .select()
    .from(schema.thoughts)
    .where(eq(schema.thoughts.id, id));

  if (!thought) {
    return NextResponse.json({ error: "Thought not found." }, { status: 404 });
  }

  return NextResponse.json(thought);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const updates: Record<string, unknown> = {};
  if (typeof body.title === "string") updates.title = body.title.trim() || null;
  if (typeof body.description === "string") updates.description = body.description.trim() || null;
  if (typeof body.contentMd === "string") updates.contentMd = body.contentMd.trim();
  updates.updatedAt = new Date();

  if (Object.keys(updates).length === 0 && !body.tagIds) {
    return NextResponse.json({ error: "No fields to update." }, { status: 400 });
  }

  // Update thought fields
  if (Object.keys(updates).length > 0) {
    const [thought] = await db
      .update(schema.thoughts)
      .set(updates)
      .where(eq(schema.thoughts.id, id))
      .returning();

    if (!thought) {
      return NextResponse.json({ error: "Thought not found." }, { status: 404 });
    }
  }

  // Update tags if provided
  if (Array.isArray(body.tagIds)) {
    // Remove existing tags
    await db
      .delete(schema.thoughtTags)
      .where(eq(schema.thoughtTags.thoughtId, id));

    // Add new tags
    if (body.tagIds.length > 0) {
      await db.insert(schema.thoughtTags).values(
        body.tagIds.map((tagId: string) => ({
          thoughtId: id,
          tagId,
        }))
      );
    }
  }

  const [thought] = await db
    .select()
    .from(schema.thoughts)
    .where(eq(schema.thoughts.id, id));

  return NextResponse.json(thought);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;

  const [thought] = await db
    .delete(schema.thoughts)
    .where(eq(schema.thoughts.id, id))
    .returning();

  if (!thought) {
    return NextResponse.json({ error: "Thought not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
