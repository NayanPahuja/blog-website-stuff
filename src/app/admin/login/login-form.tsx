"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export function AdminLoginForm() {
  const params = useSearchParams();
  const from = params.get("from") ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, from }),
      });
      if (!res.ok) {
        const body = await res.text();
        try {
          const json = JSON.parse(body);
          setError(json.error ?? "Login failed.");
        } catch {
          setError(`Server returned ${res.status}: ${body.slice(0, 200)}`);
        }
        setLoading(false);
        return;
      }
      const data = await res.json();
      // Use window.location to ensure cookies are sent with the next request
      window.location.href = data.from ?? "/admin";
    } catch (err) {
      setError(`Request failed: ${err instanceof Error ? err.message : String(err)}`);
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm space-y-4 rounded-xl border border-[var(--border)] bg-[var(--bg-2)] p-6"
    >
      <h1 className="text-xl font-semibold text-[var(--text)]">Admin sign in</h1>

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-[var(--text)]">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] placeholder:text-[var(--faint)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-[var(--text)]">Password</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] placeholder:text-[var(--faint)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
      </label>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-[var(--text)] px-4 py-2 font-medium text-[var(--bg)] disabled:opacity-50 hover:opacity-90 transition-opacity"
      >
        {loading ? "Signing in\u2026" : "Sign in"}
      </button>
    </form>
  );
}
