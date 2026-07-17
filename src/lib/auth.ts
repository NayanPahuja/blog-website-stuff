/**
 * Auth helpers for the single-admin model (TRD §2/§6).
 *
 * There is exactly one admin user (created manually in Supabase). We treat
 * "any valid authenticated session" as "the admin" — no roles table needed
 * for the MVP.
 */
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Returns the active session's user, or null if not signed in.
 * Safe to call from any Server Component / Route Handler.
 */
export async function getSession() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Returns the authenticated admin user, or redirects to /admin/login.
 * Use to guard admin pages and non-public API routes.
 *
 * `from` is included on the redirect so login can bounce back.
 */
export async function requireAdmin(from?: string) {
  const user = await getSession();
  if (!user) {
    const params = from ? `?from=${encodeURIComponent(from)}` : "";
    redirect(`/admin/login${params}`);
  }
  return user;
}
