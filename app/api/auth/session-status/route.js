
import { NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSession,
} from "@/app/lib/authSession";

// Always verify the current session.
// Do not cache authentication responses.
export const dynamic = "force-dynamic";

const NO_CACHE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

const ALLOWED_ROLES = new Set([
  "admin",
  "manager",
  "seo_manager",
  "content_manager",
  "blog_editor",
  "store_editor",
  "affiliate_editor",
]);

export async function GET(req) {
  try {
    // 1. Read the secure HttpOnly session cookie.
    const token = req.cookies.get(
      ADMIN_SESSION_COOKIE
    )?.value;

    // 2. Verify JWT signature, issuer, audience,
    //    and 12-hour absolute expiration.
    const session = await verifyAdminSession(token);

    // 3. Reject invalid, missing, or expired sessions.
    if (
      !session ||
      !session.userId ||
      !ALLOWED_ROLES.has(session.role)
    ) {
      return NextResponse.json(
        {
          authenticated: false,
          userId: null,
          role: null,
          expiresAt: null,
        },
        {
          status: 401,
          headers: NO_CACHE_HEADERS,
        }
      );
    }

    // 4. Convert JWT expiry seconds to milliseconds.
    //    Admin Layout uses Date.now(), so this is required.
    const expiresAt = session.expiresAt * 1000;

    // Additional expiry safety check.
    if (
      !Number.isFinite(expiresAt) ||
      expiresAt <= Date.now()
    ) {
      return NextResponse.json(
        {
          authenticated: false,
          userId: null,
          role: null,
          expiresAt: null,
        },
        {
          status: 401,
          headers: NO_CACHE_HEADERS,
        }
      );
    }

    // 5. Return verified session information.
    //    Never return the raw JWT or session secret.
    return NextResponse.json(
      {
        authenticated: true,
        userId: session.userId,
        role: session.role,
        expiresAt,
      },
      {
        status: 200,
        headers: NO_CACHE_HEADERS,
      }
    );
  } catch (error) {
    console.error(
      "GET /api/auth/session-status Error:",
      error
    );

    return NextResponse.json(
      {
        authenticated: false,
        error: "Unable to verify session.",
      },
      {
        status: 500,
        headers: NO_CACHE_HEADERS,
      }
    );
  }
}
