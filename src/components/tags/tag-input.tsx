"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type Tag = { id: string; name: string; slug: string };

export function TagInput({
  selected,
  onChange,
}: {
  selected: Tag[];
  onChange: (tags: Tag[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const fetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doFetch = useCallback(
    (q: string) => {
      if (fetchTimer.current) clearTimeout(fetchTimer.current);
      if (!q.trim()) {
        setSuggestions([]);
        setOpen(false);
        return;
      }
      fetchTimer.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/tags?q=${encodeURIComponent(q)}`);
          const data = await res.json();
          setSuggestions(data.filter((t: Tag) => !selected.find((s) => s.id === t.id)));
          setOpen(true);
        } catch {}
      }, 200);
    },
    [selected],
  );

  useEffect(() => {
    return () => {
      if (fetchTimer.current) clearTimeout(fetchTimer.current);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addTag = useCallback(
    (tag: Tag) => {
      onChange([...selected, tag]);
      setQuery("");
      setSuggestions([]);
      setOpen(false);
    },
    [selected, onChange],
  );

  const removeTag = useCallback(
    (tagId: string) => {
      onChange(selected.filter((t) => t.id !== tagId));
    },
    [selected, onChange],
  );

  const [tagError, setTagError] = useState<string | null>(null);

  const createAndAdd = useCallback(async () => {
    setTagError(null);
    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: query.trim() }),
    });
    if (res.ok) {
      const tag = await res.json();
      addTag(tag);
    } else {
      const data = await res.json().catch(() => ({}));
      setTagError(data.error ?? "Failed to create tag.");
    }
  }, [query, addTag]);

  const handleKeyDown = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        setTagError(null);
        const trimmed = query.trim();
        if (!trimmed) return;

        // If there's a matching suggestion, add it
        if (suggestions.length > 0) {
          addTag(suggestions[0]);
          return;
        }

        // Otherwise create a new tag
        await createAndAdd();
      }
    },
    [query, suggestions, addTag, createAndAdd],
  );

  return (
    <div ref={ref} className="relative">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selected.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--code-bg)] px-2.5 py-1 text-sm font-medium text-[var(--text)]"
            >
              {tag.name}
              <button
                type="button"
                onClick={() => removeTag(tag.id)}
                className="text-[var(--faint)] hover:text-red-500 leading-none text-base transition-colors"
                aria-label={`Remove tag ${tag.name}`}
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        type="text"
        value={query}
        onChange={(e) => {
          const v = e.target.value;
          setQuery(v);
          setTagError(null);
          doFetch(v);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Type tag name and press Enter..."
        className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm text-[var(--text)] placeholder:text-[var(--faint)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
      />
      {tagError && (
        <p className="mt-1 text-xs text-red-500">{tagError}</p>
      )}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--bg-2)] py-1 shadow-lg max-h-48 overflow-auto">
          {suggestions.map((tag) => (
            <li key={tag.id}>
              <button
                type="button"
                onClick={() => addTag(tag)}
                className="w-full px-3 py-1.5 text-left text-sm text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
              >
                {tag.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && query.trim() && suggestions.length === 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--bg-2)] p-2 shadow-lg">
          <button
            type="button"
            onClick={createAndAdd}
            className="text-sm text-[var(--link)] hover:underline"
          >
            Create &ldquo;{query.trim()}&rdquo; (or press Enter)
          </button>
        </div>
      )}
    </div>
  );
}
