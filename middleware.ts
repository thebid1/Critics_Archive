import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Middleware — session REFRESH + a coarse login redirect for ADMIN routes only.
 *
 * This is explicitly NOT a security boundary: every /admin page and every admin
 * API route re-verifies the allow-listed session server-side (lib/admin/guard.ts).
 * Middleware exists so @supabase/ssr can rotate refresh tokens in the background
 * and so unauthenticated browsers skip the admin bundle.
 *
 * Matcher is scoped to auth/admin paths only — the public storefront (/, /shop,
 * /product/*, /checkout) is never touched and never sees an auth cookie.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: do not run code between createServerClient and auth.getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Already signed in and hitting the login page → let the /admin page's own
  // server-side gate settle the allow-list (middleware can't read the non-public
  // ADMIN_ALLOWED_EMAILS env at the edge).
  if (pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // Admin pages require a signed-in user; the allow-list itself is enforced
  // server-side by the pages/routes (middleware only redirects signed-OUT users).
  // NOTE: /auth/callback is deliberately NOT gated here — it has no session yet
  // by design (it's the route that exchanges the magic-link code for one).
  if (pathname.startsWith("/admin") && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/login", "/auth/callback"],
};