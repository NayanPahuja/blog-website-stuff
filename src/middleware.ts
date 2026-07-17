import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ADMIN_PATHS = ["/admin/login"];
const PUBLIC_API_PATHS = ["/api/admin/login", "/api/analytics/track"];

export const runtime = "experimental-edge";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  const isAdminPath = pathname.startsWith("/admin");
  const isAdminPublic = PUBLIC_ADMIN_PATHS.some((p) => pathname === p);
  const isApiPath = pathname.startsWith("/api");
  const isApiWrite = isApiPath && request.method !== "GET";
  const isApiPublic = PUBLIC_API_PATHS.some((p) => pathname === p);

  const requiresAuth =
    (isAdminPath && !isAdminPublic) || (isApiWrite && !isApiPublic);

  let user = null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && anonKey && (requiresAuth || isAdminPath || isApiPath)) {
    try {
      const supabase = createServerClient(url, anonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      });
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } catch (e) {
      console.warn("[middleware] Supabase auth unavailable:", e);
    }
  }

  if (requiresAuth && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.searchParams.set("from", pathname);
    const redirect = NextResponse.redirect(loginUrl);
    redirect.headers.set("Cache-Control", "no-store");
    return redirect;
  }

  if (isAdminPath || isApiPath) {
    response.headers.set("Cache-Control", "no-store");
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
