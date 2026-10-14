
import { NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSession,
} from "@/app/lib/authSession";

// ============================================================
// GEO/IP FIREWALL CACHE — ORIGINAL 60-SECOND BEHAVIOR
// ============================================================

let cachedRules = null;
let lastFetchTime = 0;

const CACHE_TTL = 60_000;

// ============================================================
// ROLE-BASED ACCESS RESTRICTIONS
// ============================================================

const ADMIN_ONLY_ROUTES = [
  "/admin/users",
  "/admin/firewall",
];

const ADMIN_MANAGER_ROUTES = [
  "/admin/settings",
  "/admin/analytics",
  "/admin/legal",
];

function matchesRoute(pathname, route) {
  return (
    pathname === route ||
    pathname.startsWith(`${route}/`)
  );
}

function isLoginPage(pathname) {
  return [
    "/signin",
    "/admin/login",
    "/login",
  ].includes(pathname);
}

function redirectToSignin(req) {
  const loginUrl = new URL("/signin", req.url);

  loginUrl.searchParams.set(
    "callbackUrl",
    req.nextUrl.pathname
  );

  const res = NextResponse.redirect(loginUrl);

  // Clear invalid or expired session cookies.
  const expiredCookieOptions = {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };

  res.cookies.set(ADMIN_SESSION_COOKIE, "", {
    ...expiredCookieOptions,
    httpOnly: true,
  });

  res.cookies.set("user_role", "", {
    ...expiredCookieOptions,
    httpOnly: false,
  });

  return res;
}

// ============================================================
// MAIN NEXT.JS 16 PROXY
// ============================================================

export async function proxy(req) {
  const { pathname } = req.nextUrl;

  // ==========================================================
  // 1. AUTHENTICATION & ROLE-BASED ACCESS GUARD
  // ==========================================================

  const isAdminRoute =
    pathname === "/admin" ||
    pathname.startsWith("/admin/");

  if (isAdminRoute && !isLoginPage(pathname)) {
    const token = req.cookies.get(
      ADMIN_SESSION_COOKIE
    )?.value;

    // Verify signed JWT and absolute expiration.
    const session = await verifyAdminSession(token);

    if (!session) {
      return redirectToSignin(req);
    }

    // Role is read from the signed token.
    // Never trust the editable user_role cookie.
    const userRole = session.role;

    // Admin-only routes.
    if (
      ADMIN_ONLY_ROUTES.some((route) =>
        matchesRoute(pathname, route)
      )
    ) {
      if (
        userRole !== "admin" &&
        userRole !== "super_admin"
      ) {
        return NextResponse.redirect(
          new URL(
            "/admin?error=unauthorized",
            req.url
          )
        );
      }
    }

    // Admin and manager routes.
    if (
      ADMIN_MANAGER_ROUTES.some((route) =>
        matchesRoute(pathname, route)
      )
    ) {
      if (
        userRole !== "admin" &&
        userRole !== "super_admin" &&
        userRole !== "manager"
      ) {
        return NextResponse.redirect(
          new URL(
            "/admin?error=unauthorized",
            req.url
          )
        );
      }
    }
  }

  // ==========================================================
  // 2. GEO & IP FIREWALL — ORIGINAL LOGIC PRESERVED
  // ==========================================================

  const country =
    req.headers.get("x-vercel-ip-country") ||
    req.geo?.country ||
    "UNKNOWN";

  const forwardedFor = req.headers.get(
    "x-forwarded-for"
  );

  const ip = forwardedFor
    ? forwardedFor.split(",")[0]
    : req.ip || "UNKNOWN";

  // ==========================================================
  // 3. FETCH ACTIVE FIREWALL RULES
  // ==========================================================

  const now = Date.now();

  if (
    !cachedRules ||
    now - lastFetchTime > CACHE_TTL
  ) {
    try {
      const baseUrl =
        req.headers.get("x-forwarded-proto") ===
        "https"
          ? `https://${req.headers.get("host")}`
          : req.nextUrl.origin;

      console.log(
        `[PROXY] Fetching rules from: ${baseUrl}/api/geo-firewall/active`
      );

      const res = await fetch(
        `${baseUrl}/api/geo-firewall/active`,
        {
          next: { revalidate: 60 },
        }
      );

      if (res.ok) {
        const json = await res.json();

        cachedRules = Array.isArray(json.data)
          ? json.data
          : [];

        lastFetchTime = now;

        console.log(
          `[PROXY] Successfully loaded ${cachedRules.length} active rules.`
        );
      } else {
        console.error(
          `[PROXY] API Error Status: ${res.status}`
        );
      }
    } catch (error) {
      console.error(
        "[LIVE_PROXY_FETCH_ERROR]: API se data nahi aaya:",
        error.message
      );

      // Preserve original fail-open behavior.
      return NextResponse.next();
    }
  }

  // ==========================================================
  // 4. EVALUATE FIREWALL RULES
  // ==========================================================

  const rules = cachedRules || [];

  for (const rule of rules) {
    const isGlobal =
      rule.scope === "global";

    const matchesFirewallRoute =
      rule.scope === "routes" &&
      Array.isArray(rule.targetRoutes) &&
      rule.targetRoutes.some((route) =>
        pathname.startsWith(route)
      );

    if (
      !isGlobal &&
      !matchesFirewallRoute
    ) {
      continue;
    }

    let isMatch = false;

    if (
      rule.blockType === "country" &&
      rule.value === country
    ) {
      isMatch = true;
    } else if (
      rule.blockType === "ip_address" &&
      rule.value === ip
    ) {
      isMatch = true;
    }

    if (!isMatch) {
      continue;
    }

    // ========================================================
    // 5. ENFORCE FIREWALL ACTION
    // ========================================================

    if (
      rule.action === "redirect" &&
      rule.redirectUrl
    ) {
      const redirectUrl = new URL(
        rule.redirectUrl,
        req.nextUrl.origin
      );

      if (
        pathname !== redirectUrl.pathname
      ) {
        return NextResponse.redirect(
          new URL(rule.redirectUrl, req.url)
        );
      }
    } else {
      return new NextResponse(
        JSON.stringify({
          error:
            "Access denied by firewall policy.",
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
  }

  return NextResponse.next();
}

// ============================================================
// 6. MATCHER — PRESERVE ORIGINAL EXCLUSIONS
// ============================================================

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/geo-firewall/active).*)",
  ],
};
