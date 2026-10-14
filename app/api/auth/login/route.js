
import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import User from "@/app/models/user";

import {
  createAdminSession,
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
} from "@/app/lib/authSession";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export async function POST(req) {
  try {
    await connectDB();

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Existing password field selection preserved.
    const user = await User.findOne({
      email: cleanEmail,
    }).select("+password");

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // 1. Check account status
    if (user.status === "disabled") {
      return NextResponse.json(
        {
          error:
            "Your account has been deactivated. Please contact support.",
        },
        { status: 403 }
      );
    }

    // 2. Check account lockout
    if (
      user.lockoutUntil &&
      new Date(user.lockoutUntil) > new Date()
    ) {
      const remainingMins = Math.ceil(
        (new Date(user.lockoutUntil) - new Date()) /
          (60 * 1000)
      );

      return NextResponse.json(
        {
          error:
            `Account is temporarily locked due to multiple failed attempts. Try again in ${remainingMins} minute(s).`,
        },
        { status: 423 }
      );
    }

    // 3. Existing password comparison — UNCHANGED.
    // No hashing, encryption or decryption added.
    const isMatch = password === user.password;

    if (!isMatch) {
      const newAttempts = (user.loginAttempts || 0) + 1;

      const updatePayload = {
        loginAttempts: newAttempts,
      };

      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        updatePayload.lockoutUntil = new Date(
          Date.now() + LOCKOUT_DURATION_MS
        );
      }

      await User.findByIdAndUpdate(
        user._id,
        updatePayload
      );

      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // 4. Create signed session before updating login state.
    // Throws if AUTH_SESSION_SECRET is missing/invalid.
    const sessionToken = await createAdminSession(user);

    // 5. Successful login — existing atomic update preserved.
    await User.findByIdAndUpdate(user._id, {
      $set: {
        loginAttempts: 0,
        lockoutUntil: null,
        lastLoginAt: new Date(),
      },
    });

    // 6. Existing response structure preserved.
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const res = NextResponse.json({
      success: true,
      message: "Authenticated successfully.",
      user: userResponse,
    });

    // 7. Cookie settings — 12-hour absolute expiry.
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: ADMIN_SESSION_MAX_AGE,
      path: "/",
    };

    // Signed JWT replaces old unsigned Base64 token.
    res.cookies.set(
      ADMIN_SESSION_COOKIE,
      sessionToken,
      cookieOptions
    );

    // Keep existing role cookie for UI compatibility.
    // Middleware must NOT trust this cookie for authorization.
    res.cookies.set("user_role", user.role, {
      ...cookieOptions,
      httpOnly: false,
    });

    return res;
  } catch (error) {
    console.error("POST /api/auth/login Error:", error);

    return NextResponse.json(
      {
        error:
          error.message ||
          "An unexpected error occurred during login.",
      },
      { status: 500 }
    );
  }
}
