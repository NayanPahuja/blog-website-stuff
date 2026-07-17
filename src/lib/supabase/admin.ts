/**
 * Service-role Supabase client.
 *
 * Bypasses RLS entirely — use ONLY server-side for operations RLS can't
 * express cleanly, e.g. inserting into the insert-only `page_views` table
 * from the public analytics track route (TRD §4).
 *
 * NEVER import this into a Client Component and never expose the
 * service-role key to the browser.
 */
import { createClient } from "@supabase/supabase-js";

let _client: ReturnType<typeof createClient> | null = null;

export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and " +
        "SUPABASE_SERVICE_ROLE_KEY (set as a server secret).",
    );
  }

  if (!_client) {
    _client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _client;
}
