import { NextResponse } from "next/server";

// Fallback in-memory cache for the edge isolate
let cachedRules = null;
let lastFetchTime = 0;
const CACHE_TTL = 60000; // 60 seconds (1 minute cache)

// Role-based restrictions for sensitive admin sections
const ADMIN_ONLY_ROUTES = ["/admin/users", "/admin/firewall"];
const ADMIN_MANAGER_ROUTES = ["/admin/settings", "/admin/analytics", "/admin/legal"];

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // ─────────────────────────────────────────────────────────────
  // 1. ROLE-BASED ACCESS GUARD FOR /admin
  // ─────────────────────────────────────────────────────────────
const isLoginPage = pathname === "/signin" || pathname === "/admin/login" || pathname === "/login";
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute && !isLoginPage) {
    // Session cookie check (token ya direct user cookie jo login par set hoti hai)
    const token =
      req.cookies.get("admin_token")?.value ||
      req.cookies.get("token")?.value ||
      req.cookies.get("portal_token")?.value;

    const userRole = req.cookies.get("user_role")?.value; // Role cookie: e.g. "admin", "blog_editor", etc.

    // Agar user logged in nahi hai to login par redirect karein
if (!token) {
  const loginUrl = new URL("/signin", req.url);
  loginUrl.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(loginUrl);
}

    // Role-based route protection
    if (userRole) {
      // 1. Only admin can access Users & Firewall
      if (ADMIN_ONLY_ROUTES.some((route) => pathname.startsWith(route))) {
        if (userRole !== "admin" && userRole !== "super_admin") {
          return NextResponse.redirect(new URL("/admin?error=unauthorized", req.url));
        }
      }

      // 2. Only admin and manager can access Settings & Analytics
      if (ADMIN_MANAGER_ROUTES.some((route) => pathname.startsWith(route))) {
        if (userRole !== "admin" && userRole !== "super_admin" && userRole !== "manager") {
          return NextResponse.redirect(new URL("/admin?error=unauthorized", req.url));
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. FIREWALL GEO & IP CHECK (ORIGINAL LOGIC UNCHANGED)
  // ─────────────────────────────────────────────────────────────

  // Get User Data (Vercel Production Headers)
  const country =
    req.headers.get("x-vercel-ip-country") || req.geo?.country || "UNKNOWN";

  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0] : req.ip || "UNKNOWN";

  // Fetch Active Rules (with Edge caching fallback)
  const now = Date.now();
  if (!cachedRules || now - lastFetchTime > CACHE_TTL) {
    try {
      const baseUrl =
        req.headers.get("x-forwarded-proto") === "https"
          ? `https://${req.headers.get("host")}`
          : req.nextUrl.origin;

      console.log(
        `[MIDDLEWARE] Fetching rules from: ${baseUrl}/api/geo-firewall/active`,
      );

      const res = await fetch(`${baseUrl}/api/geo-firewall/active`, {
        next: { revalidate: 60 },
      });

      if (res.ok) {
        const json = await res.json();
        cachedRules = json.data || [];
        lastFetchTime = now;
        console.log(
          `[MIDDLEWARE] Successfully loaded ${cachedRules.length} active rules.`,
        );
      } else {
        console.error(`[MIDDLEWARE] API Error Status: ${res.status}`);
      }
    } catch (error) {
      console.error(
        "[LIVE_MIDDLEWARE_FETCH_ERROR]: API se data nahi aaya:",
        error.message,
      );
      return NextResponse.next();
    }
  }

  const rules = cachedRules || [];

  // Evaluate Rules
  for (const rule of rules) {
    const isGlobal = rule.scope === "global";
    const matchesRoute =
      rule.scope === "routes" &&
      rule.targetRoutes.some((route) => pathname.startsWith(route));

    if (!isGlobal && !matchesRoute) continue;

    let isMatch = false;

    if (rule.blockType === "country" && rule.value === country) {
      isMatch = true;
    } else if (rule.blockType === "ip_address" && rule.value === ip) {
      isMatch = true;
    }

    // Enforce Action
    if (isMatch) {
      if (rule.action === "redirect" && rule.redirectUrl) {
        if (
          pathname !== new URL(rule.redirectUrl, req.nextUrl.origin).pathname
        ) {
          return NextResponse.redirect(new URL(rule.redirectUrl, req.url));
        }
      } else {
        return new NextResponse(
          JSON.stringify({ error: "Access denied by firewall policy." }),
          { status: 403, headers: { "Content-Type": "application/json" } },
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/geo-firewall/active).*)",
  ],
};