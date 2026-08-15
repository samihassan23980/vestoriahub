import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import AmazonDeal from "@/app/models/amazonDeal";
import "@/app/models/category";

export async function GET(req, { params }) {
  try {
    await connectDB();

    const slug = params.slug.toLowerCase().trim();

    // Fetch the deal explicitly matching the slug and ensuring it is active
    const deal = await AmazonDeal.findOne({ slug: slug, status: "active" })
      .populate("category", "name slug")
      .lean();

    if (!deal) {
      return NextResponse.json(
        { error: "Amazon deal not found or has expired." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { deal },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    console.error("GET /public/amazon-deals/[slug] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Amazon deal details." },
      { status: 500 },
    );
  }
}
