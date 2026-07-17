/**
 * Cookie-based Supabase client for Server Components and Route Handlers.
 *
 * Uses @supabase/ssr to keep the auth session in an HTTP-only cookie (TRD §6:
 * "stored in an HTTP-only cookie, validated in a Next.js middleware"). This is
 * the client used for authenticated reads/writes that respect RLS.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component where cookies can't be set.
            // Safe to ignore — middleware refreshes the session.
          }
        },
      },
    },
  );
}
