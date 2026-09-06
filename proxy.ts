import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";
import {
  getSiteGateSettings,
  isValidUnlock,
  SITE_UNLOCK_COOKIE,
} from "@/lib/site-gate";

/**
 * proxy.ts (renamed from middleware.ts in Next 16) — host-based routing between
 * the storefront (www.criticsarchive.com) and the admin subdomain
 * (admin.criticsarchive.com), plus session REFRESH + a coarse login redirect.
 * Not a security boundary: /admin pages and APIs re-verify the allow-listed
 * session server-side.
 */
const ADMIN_ORIGIN = process.env.ADMIN_SITE_URL ?? "https://admin.criticsarchive.com";

function isAdminHost(host: string): boolean {
  return host.startsWith("admin.");
}

function isProdStorefront(host: string): boolean {
  return host === "www.criticsarchive.com" || host === "criticsarchive.com";
}

/** Storefront pages covered by the pre-launch password gate. */
function isLockedPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname.startsWith("/shop") ||
    pathname.startsWith("/product/") ||
    pathname.startsWith("/checkout")
  );
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;

  // Production storefront: the privileged admin surface must not be reachable here.
  if (isProdStorefront(host)) {
    if (
      pathname.startsWith("/admin") ||
      pathname === "/login" ||
      pathname.startsWith("/auth")
    ) {
      return NextResponse.redirect(new URL(pathname, ADMIN_ORIGIN));
    }
  }

  const adminHost = isAdminHost(host);

  // Pre-launch password gate: only the storefront (never the admin host), and only
  // the shop paths (/, /shop, /product/*, /checkout). Info/legal pages stay public.
  if (!adminHost && isLockedPath(pathname)) {
    const { enabled, hash } = await getSiteGateSettings();
    if (enabled && hash) {
      const cookie = request.cookies.get(SITE_UNLOCK_COOKIE)?.value ?? "";
      if (!(await isValidUnlock(cookie, hash))) {
        // Remember where the visitor was headed so the gate form can return them
        // there after a successful unlock.
        const target = pathname + request.nextUrl.search;
        const gate = new URL("/coming-soon", request.url);
        gate.searchParams.set("next", target);
        return NextResponse.redirect(gate);
      }
    }
  }

  // Only the admin host, or admin/auth paths on any host, need a session. Skip
  // Supabase entirely for everything else (e.g. the localhost storefront).
  const needsSession =
    adminHost ||
    pathname.startsWith("/admin") ||
    pathname === "/login" ||
    pathname.startsWith("/auth");

  if (!needsSession) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request: { headers: request.headers } });
  let refreshCookies: { name: string; value: string; options?: CookieOptions }[] = [];

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
          refreshCookies = cookiesToSet;
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

  // Carry refreshed session cookies onto any redirect/rewrite response.
  const withCookies = (res: NextResponse) => {
    refreshCookies.forEach(({ name, value, options }) =>
      res.cookies.set(name, value, options)
    );
    return res;
  };

  if (adminHost) {
    // Dashboard lives at the subdomain root.
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return withCookies(NextResponse.rewrite(url));
    }
    const isPublic = pathname === "/login" || pathname.startsWith("/auth");
    if (!user && !isPublic) {
      return withCookies(NextResponse.redirect(new URL("/login", request.url)));
    }
    if (pathname === "/login" && user) {
      return withCookies(NextResponse.redirect(new URL("/", request.url)));
    }
    return response;
  }

  // Local dev — keep the path-based /admin behaviour.
  if (pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  if (pathname.startsWith("/admin") && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return response;
}

export const config = {
  matcher: [
    "/",
    "/shop/:path*",
    "/product/:path*",
    "/checkout",
    "/admin/:path*",
    "/login",
    "/auth/:path*",
  ],
};
