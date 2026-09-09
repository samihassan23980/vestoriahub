import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = cookies();

    // 1. Next.js server context se tamam auth cookies delete karein
    cookieStore.delete("admin_token");
    cookieStore.delete("user_role");
    cookieStore.delete("token");
    cookieStore.delete("portal_token");

    const res = NextResponse.json(
      { success: true, message: "Logout successful. Session cleared." },
      { status: 200 },
    );

    // 2. Response headers par maxAge: 0 set karein taake browser client se cookies foran flush ho jayein
    const expiredCookieOptions = {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    };

    res.cookies.set("admin_token", "", { ...expiredCookieOptions, httpOnly: true });
    res.cookies.set("user_role", "", { ...expiredCookieOptions, httpOnly: false });
    res.cookies.set("token", "", { ...expiredCookieOptions, httpOnly: true });
    res.cookies.set("portal_token", "", { ...expiredCookieOptions, httpOnly: true });

    return res;
  } catch (error) {
    console.error("Logout API Error:", error);
    return NextResponse.json(
      { error: "An error occurred while logging out." },
      { status: 500 },
    );
  }
}