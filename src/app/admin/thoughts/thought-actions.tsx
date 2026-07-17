"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ThoughtActions({ id }: { id: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this thought?")) return;
    setDeleting(true);
    const res = await fetch(`/api/thoughts/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    }
    setDeleting(false);
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="ml-2 text-xs text-[var(--faint)] hover:text-red-500 transition-colors disabled:opacity-50"
      aria-label="Delete thought"
    >
      {deleting ? "..." : "Delete"}
    </button>
  );
}
