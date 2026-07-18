"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MarkdownEditor } from "@/components/editor/markdown-editor";
import { TagInput } from "@/components/tags/tag-input";

type Tag = {
  id: string;
  name: string;
  slug: string;
};

type Thought = {
  id: string;
  title: string | null;
  description: string | null;
  contentMd: string;
};

export function ThoughtEditor({ thought }: { thought?: Thought }) {
  const router = useRouter();
  const isNew = !thought;
  const [title, setTitle] = useState(thought?.title ?? "");
  const [description, setDescription] = useState(thought?.description ?? "");
  const [contentMd, setContentMd] = useState(thought?.contentMd ?? "");
  const [tags, setTags] = useState<Tag[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [thoughtId, setThoughtId] = useState(thought?.id ?? null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, []);

  // Load existing tags for the thought
  useEffect(() => {
    if (!thought) return;
    async function loadTags() {
      try {
        const res = await fetch(`/api/thoughts/${thought!.id}/tags`);
        if (res.ok) {
          const data = await res.json();
          setTags(data);
        }
      } catch {}
    }
    loadTags();
  }, [thought]);

  const handleSave = useCallback(
    async (md?: string) => {
      setSaving(true);
      setSaved(false);

      const payload = {
        title: title.trim() || null,
        description: description.trim() || null,
        contentMd: md ?? contentMd,
        tagIds: tags.map((t) => t.id),
      };

      try {
        let res;
        if (isNew && !thoughtId) {
          res = await fetch("/api/thoughts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            const data = await res.json();
            setThoughtId(data.id);
            router.replace(`/admin/thoughts/${data.id}`);
            router.refresh();
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
            return;
          }
        } else {
          res = await fetch(`/api/thoughts/${thoughtId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        }

        if (res!.ok) {
          setSaved(true);
          router.refresh();
          setTimeout(() => setSaved(false), 2000);
        } else {
          const data = await res!.json();
          alert(data.error ?? "Failed to save.");
        }
      } catch {
        alert("Network error.");
      } finally {
        setSaving(false);
      }
    },
    [title, description, contentMd, tags, isNew, thoughtId, router],
  );

  const handleAutoSave = useCallback(
    (md: string) => {
      setContentMd(md);
      if (isNew || !thoughtId) return;
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        fetch(`/api/thoughts/${thoughtId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentMd: md,
            title: title.trim() || null,
            description: description.trim() || null,
            tagIds: tags.map((t) => t.id),
          }),
        }).catch(() => {});
      }, 2000);
    },
    [isNew, thoughtId, title, description, tags],
  );

  const handlePublishAsBlog = async () => {
    if (!thoughtId) return;
    
    setPublishing(true);
    try {
      const res = await fetch(`/api/thoughts/${thoughtId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "blog" }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/admin/blogs/${data.id}`);
      } else {
        const data = await res.json();
        alert(data.error ?? "Failed to publish.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setPublishing(false);
    }
  };

  const handlePublishAsProject = async () => {
    if (!thoughtId) return;
    
    setPublishing(true);
    try {
      const res = await fetch(`/api/thoughts/${thoughtId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "project" }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/admin/projects/${data.id}`);
      } else {
        const data = await res.json();
        alert(data.error ?? "Failed to publish.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">
            {isNew ? "New thought" : "Edit thought"}
          </h1>
          {thoughtId && (
            <p className="mt-1 text-sm text-[var(--muted)]">
              Status: <span className="font-medium">Private draft</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {thoughtId && (
            <div className="relative group">
              <button
                type="button"
                disabled={publishing}
                className="rounded-md bg-[var(--surface-2)] border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface)] disabled:opacity-50 transition-colors"
              >
                {publishing ? "Publishing..." : "Publish as..."}
              </button>
              <div className="hidden group-hover:block absolute right-0 top-full mt-1 w-48 rounded-md border border-[var(--border)] bg-[var(--bg-2)] shadow-lg z-10">
                <button
                  type="button"
                  onClick={handlePublishAsBlog}
                  disabled={publishing}
                  className="w-full px-4 py-2 text-left text-sm text-[var(--text)] hover:bg-[var(--surface)] transition-colors disabled:opacity-50"
                >
                  📝 Blog post
                </button>
                <button
                  type="button"
                  onClick={handlePublishAsProject}
                  disabled={publishing}
                  className="w-full px-4 py-2 text-left text-sm text-[var(--text)] hover:bg-[var(--surface)] transition-colors disabled:opacity-50"
                >
                  🚀 Project
                </button>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="rounded-md bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-[var(--bg)] shadow-sm hover:shadow-md hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </span>
            ) : saved ? "Saved!" : isNew ? "Create Draft" : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Thought title (optional)"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-lg font-medium text-[var(--text)] placeholder:text-[var(--faint)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description (optional)"
          rows={2}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--faint)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
        />

        <div>
          <label className="block text-sm font-medium text-[var(--muted)] mb-2">
            Tags
          </label>
          <TagInput selected={tags} onChange={setTags} />
        </div>

        <MarkdownEditor
          initialContent={thought?.contentMd ?? ""}
          onChange={handleAutoSave}
          onSave={(md) => handleSave(md)}
          placeholder="Start writing your thought..."
          saving={saving}
        />
      </div>
    </div>
  );
}
