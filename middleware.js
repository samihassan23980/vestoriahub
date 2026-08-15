import { NextResponse } from "next/server";

// Fallback in-memory cache for the edge isolate
let cachedRules = null;
let lastFetchTime = 0;
const CACHE_TTL = 60000; // 60 seconds (1 minute cache)

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // 1. Get User Data (BULLETPROOF FOR VERCEL PRODUCTION)
  // Vercel headers ko pehle check karega, phir fallback karega
  const country =
    req.headers.get("x-vercel-ip-country") || req.geo?.country || "UNKNOWN";

  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0] : req.ip || "UNKNOWN";

  // 2. Fetch Active Rules (with Edge caching fallback)
  const now = Date.now();
  if (!cachedRules || now - lastFetchTime > CACHE_TTL) {
    try {
      // Use absolute URL for fetch in middleware
      const baseUrl =
        req.headers.get("x-forwarded-proto") === "https"
          ? `https://${req.headers.get("host")}`
          : req.nextUrl.origin;

      console.log(
        `[MIDDLEWARE] Fetching rules from: ${baseUrl}/api/geo-firewall/active`,
      );

      const res = await fetch(`${baseUrl}/api/geo-firewall/active`, {
        next: { revalidate: 60 }, // Utilize Next.js Data Cache
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
      // YEH LOG VERCEL PAR BATAYEGA KE FETCH FAIL KYUN HUA
      console.error(
        "[LIVE_MIDDLEWARE_FETCH_ERROR]: API se data nahi aaya:",
        error.message,
      );
      return NextResponse.next();
    }
  }

  const rules = cachedRules || [];

  // 3. Evaluate Rules
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

    // 4. Enforce Action
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
