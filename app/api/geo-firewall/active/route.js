import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import GeoFirewall from "@/app/models/geoFirewall";

// Cache this route for 60 seconds at the Edge/CDN level
export const revalidate = 60;

export async function GET() {
  try {
    await connectDB();

    // Sirf Active rules fetch karega jo middleware ko chahiye
    const activeRules = await GeoFirewall.find({ status: "active" })
      .select("blockType value action redirectUrl scope targetRoutes")
      .lean();

    return NextResponse.json(
      { success: true, data: activeRules },
      { status: 200 },
    );
  } catch (error) {
    console.error("[GET_ACTIVE_RULES_ERROR]:", error);
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}
