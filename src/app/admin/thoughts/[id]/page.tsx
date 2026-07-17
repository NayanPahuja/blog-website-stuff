import { notFound } from "next/navigation";
import { db, schema } from "@/db/client";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";
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
    .from(schema.thoughts)
    .where(eq(schema.thoughts.id, id));

  if (!thought) notFound();

  return <ThoughtEditor thought={thought} />;
}
