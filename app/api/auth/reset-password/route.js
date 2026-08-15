import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/app/lib/mongodb";
import User from "@/app/models/user";

export async function POST(req) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Token and new password are required." },
        { status: 400 },
      );
    }

    // Password strength validation (Basic example)
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 },
      );
    }

    await connectDB();

    // 1. Hash the incoming plain token to compare with the stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // 2. Find user with matching token AND token hasn't expired yet
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { $gt: Date.now() }, // Token expiry must be strictly greater than current time
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired password reset token." },
        { status: 400 },
      );
    }

    // 3. Update the password
    // (Aapke User schema mein 'pre("save")' hook automatic is naye password ko bcrypt se hash (cost 12) kar dega)
    user.password = newPassword;

    // 4. Clear the reset tokens from database (Security requirement)
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;

    await user.save();

    return NextResponse.json(
      { message: "Password has been successfully reset. You can now log in." },
      { status: 200 },
    );
  } catch (error) {
    console.error("Reset Password API Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 },
    );
  }
}
