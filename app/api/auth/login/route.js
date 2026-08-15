import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { connectDB } from "@/app/lib/mongodb"; // Aapka updated DB connection file
import User from "@/app/models/user";

const JWT_SECRET = process.env.JWT_SECRET || "your-fallback-super-secret-key";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // 1. Input Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }

    // 2. Database Connection
    await connectDB();

    // 3. Find User (Explicitly selecting password as per schema design)
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");

    if (!user) {
      // Generic error message prevents email enumeration attacks
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    // 4. Check Account Status (Disabled)
    if (user.status === "disabled") {
      return NextResponse.json(
        { error: "Your account has been disabled by the administrator." },
        { status: 403 },
      );
    }

    // 5. Check Email Verification
    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Please verify your email address before logging in." },
        { status: 403 },
      );
    }

    // 6. Check Brute-Force Lockout
    if (user.isLockedOut()) {
      const lockMinutes = Math.ceil((user.lockoutUntil - new Date()) / 60000);
      return NextResponse.json(
        {
          error: `Account locked due to too many failed attempts. Try again in ${lockMinutes} minutes.`,
        },
        { status: 423 }, // 423 Locked
      );
    }

    // 7. Verify Password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      // Record failed attempt and save (handles automatic lockout internally)
      await user.recordFailedLogin();
      await user.save();

      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    // 8. Success: Reset failed attempts & update lastLoginAt
    user.recordSuccessfulLogin();
    await user.save();

    // 9. Generate JWT
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        email: user.email,
        canAccessAdmin: user.access.canAccessAdmin,
      },
      JWT_SECRET,
      { expiresIn: "7d" }, // Token expires in 7 days
    );

    // 10. Set HTTP-Only Cookie via Next.js cookies() API
    cookies().set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: "/",
    });

    // Remove password from the response payload
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.emailVerifyToken;
    delete userObj.resetPasswordToken;

    return NextResponse.json(
      {
        message: "Login successful",
        user: userObj,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred during login." },
      { status: 500 },
    );
  }
}
