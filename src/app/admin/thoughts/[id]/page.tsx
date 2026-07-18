import { notFound } from "next/navigation";
import { db, schema } from "@/db/client";
import { requireAdmin } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { ThoughtEditor } from "./thought-editor";

export const dynamic = "force-dynamic";

export default async function EditThoughtPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  if (id === "new") {
    return <ThoughtEditor />;
  }

  const [thought] = await db
    .select()
    .from(schema.contents)
    .where(and(eq(schema.contents.id, id), eq(schema.contents.contentType, "thought")));

  if (!thought) notFound();

  return <ThoughtEditor thought={thought} />;
}
