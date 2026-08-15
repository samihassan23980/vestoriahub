import { NextResponse } from "next/server";
import { getHomeLayout } from "@/app/lib/getHomeLayout";

export const revalidate = 3600;

export async function GET() {
  try {
    const layout = await getHomeLayout();

    if (!layout) {
      return NextResponse.json({ error: "No blogs found" }, { status: 404 });
    }

    return NextResponse.json(layout, {
      status: 200,
      headers: {
        "Cache-Control":
          "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("GET /api/public/blogs/home-layout Error:", error);

    return NextResponse.json(
      { error: "Failed to fetch home layout." },
      { status: 500 },
    );
  }
}