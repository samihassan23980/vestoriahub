import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import NewHeroSlideEditor from "@/app/(admin)/admin/slider/new/page";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    // Geo-targeting: Fallback to GLOBAL if frontend doesn't pass a country code
    const countryCode = (
      searchParams.get("countryCode") || "GLOBAL"
    ).toUpperCase();

    const now = new Date();

    // Complex Query: Fetch active slides OR scheduled slides that are currently valid
    const query = {
      countryCode: { $in: [countryCode, "GLOBAL"] },
      $or: [
        { status: "active" },
        {
          status: "scheduled",
          "schedule.startDate": { $lte: now },
          $or: [
            { "schedule.endDate": null }, // No end date
            { "schedule.endDate": { $gte: now } }, // End date is in the future
          ],
        },
      ],
    };

    const slides = await NewHeroSlideEditor.find(query)
      // Exclude admin-only internal name to keep payload clean
      .select("-internalName")
      // Sort exactly as defined in schema: sortOrder 0 comes first
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    return NextResponse.json(
      { slides },
      {
        status: 200,
        // Short cache (5 minutes) because scheduled flash sales can activate/deactivate
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    console.error("GET /public/hero-slides Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch hero slides." },
      { status: 500 },
    );
  }
}
