import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/app/lib/mongodb";
import User from "@/app/models/user";

export async function POST(req) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required." },
        { status: 400 },
      );
    }

    await connectDB();

    // 1. Hash the plain token received from the URL
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // 2. Find the user with this token
    const user = await User.findOne({ emailVerifyToken: hashedToken });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired email verification token." },
        { status: 400 },
      );
    }

    // 3. Mark email as verified and clear the token
    user.emailVerified = true;
    user.emailVerifyToken = null; // Clear token after successful verification

    await user.save({ validateModifiedOnly: true });

    return NextResponse.json(
      { message: "Email has been successfully verified. You can now log in." },
      { status: 200 },
    );
  } catch (error) {
    console.error("Verify Email API Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 },
    );
  }
}
