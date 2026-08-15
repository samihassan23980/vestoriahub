import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import AmazonDeal from "@/app/models/amazonDeal";
import "@/app/models/category"; // Required for population

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const countryCode = (
      searchParams.get("countryCode") || "GLOBAL"
    ).toUpperCase();
    const categoryId = searchParams.get("categoryId");
    const isFeatured = searchParams.get("isFeatured");

    const query = { status: "active" };

    if (countryCode !== "GLOBAL") {
      query.countryCode = { $in: [countryCode, "GLOBAL"] };
    } else {
      query.countryCode = "GLOBAL";
    }

    if (categoryId) query.category = categoryId;
    if (isFeatured === "true") query.isFeatured = true;

    // Default sorting matches the requirement: Highest discount percentage first
    // If we filter by 'isFeatured', we also want the best discounts among featured deals
    const deals = await AmazonDeal.find(query)
      .populate("category", "name slug")
      .sort({ discountPercentage: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await AmazonDeal.countDocuments(query);

    return NextResponse.json(
      {
        deals,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    console.error("GET /public/amazon-deals Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Amazon deals." },
      { status: 500 },
    );
  }
}
