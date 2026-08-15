import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    // Clear the HTTP-Only cookie by deleting it via Next.js cookies API
    cookies().delete("token");

    return NextResponse.json(
      { message: "Logout successful. Session cleared." },
      { status: 200 },
    );
  } catch (error) {
    console.error("Logout API Error:", error);
    return NextResponse.json(
      { error: "An error occurred while logging out." },
      { status: 500 },
    );
  }
}
