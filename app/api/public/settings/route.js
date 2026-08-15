import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import SiteSettings from "@/app/models/siteSettings";

const SINGLETON_ID = "sociantech-global";

export async function GET(req) {
  try {
    await connectDB();

    // Fetch the singleton settings document
    const settings = await SiteSettings.findOne({ singletonId: SINGLETON_ID })
      // SECURITY: Exclude sensitive admin-only fields and internal DB fields
      .select("-adminEmail -singletonId -_id -__v -createdAt -updatedAt")
      .lean();

    if (!settings) {
      // Graceful fallback if settings haven't been configured yet
      // This prevents the frontend from crashing on initial deployment
      return NextResponse.json(
        {
          settings: {
            siteName: "Sociantech",
            maintenanceMode: false,
            branding: {},
            socials: {},
          },
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      { settings },
      {
        status: 200,
        // Extremely Aggressive Cache: 1 Hour (Site settings rarely change)
        // This ensures your header/footer renders instantly without hitting the DB every time
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    console.error("GET /public/settings Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch global site settings." },
      { status: 500 },
    );
  }
}
