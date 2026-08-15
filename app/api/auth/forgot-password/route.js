import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/app/lib/mongodb";
import User from "@/app/models/user";

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 },
      );
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // SECURITY: Hamesha success message return karein, chahe email exist na karti ho.
    // Yeh "Email Enumeration Attack" (hacker ko pata chal jana ke email registered hai ya nahi) se bachata hai.
    if (!user) {
      return NextResponse.json(
        {
          message:
            "If an account with that email exists, a password reset link has been sent.",
        },
        { status: 200 },
      );
    }

    // 1. Generate a secure random token (Plain token email mein bhejna hai)
    const resetToken = crypto.randomBytes(32).toString("hex");

    // 2. Hash the token for database storage (SHA-256)
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // 3. Update User document
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry (as per schema)

    // Save without running validation on other modified fields (if any)
    await user.save({ validateModifiedOnly: true });

    // 4. Send Email (Replace this with your actual email service like Resend, SendGrid, NodeMailer)
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

    // TODO: Implement your email sending logic here
    console.log(
      `[Email Service Mock] Password Reset URL for ${user.email}:`,
      resetUrl,
    );

    return NextResponse.json(
      {
        message:
          "If an account with that email exists, a password reset link has been sent.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Forgot Password API Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 },
    );
  }
}
