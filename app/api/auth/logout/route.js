
import { NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
} from "@/app/lib/authSession";

export async function POST() {
  try {
    const res = NextResponse.json(
      {
        success: true,
        message: "Logout successful. Session cleared.",
      },
      { status: 200 }
    );

    // Clear existing authentication cookies.
    // Preserve all cookie names for compatibility.
    const cookiesToClear = [
      {
        name: ADMIN_SESSION_COOKIE,
        httpOnly: true,
      },
      {
        name: "user_role",
        httpOnly: false,
      },
      {
        name: "token",
        httpOnly: true,
      },
      {
        name: "portal_token",
        httpOnly: true,
      },
    ];

    const expiredCookieOptions = {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    };

    for (const cookie of cookiesToClear) {
      res.cookies.set(cookie.name, "", {
        ...expiredCookieOptions,
        httpOnly: cookie.httpOnly,
      });
    }

    return res;
  } catch (error) {
    console.error("Logout API Error:", error);

    return NextResponse.json(
      {
        error: "An error occurred while logging out.",
      },
      { status: 500 }
    );
  }
}
