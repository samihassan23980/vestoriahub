import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import AmazonDeal from "@/app/models/amazonDeal";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const status = searchParams.get("status");
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");

    const query = {};
    if (status) query.status = status;
    if (categoryId) query.category = categoryId;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { asin: { $regex: search, $options: "i" } }, // Exact ASIN match search
      ];
    }

    const deals = await AmazonDeal.find(query)
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await AmazonDeal.countDocuments(query);

    return NextResponse.json(
      { deals, total, page, totalPages: Math.ceil(total / limit) },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /admin/amazon-deals Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Amazon deals." },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    const newDeal = new AmazonDeal(body);

    // The Schema.pre("save") hook will validate that dealPrice <= originalPrice
    // and automatically calculate the discountPercentage.
    await newDeal.save();

    return NextResponse.json(
      { message: "Amazon deal created successfully.", deal: newDeal },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /admin/amazon-deals Error:", error);

    if (error.code === 11000) {
      if (error.keyPattern?.slug)
        return NextResponse.json(
          { error: "URL slug must be unique." },
          { status: 409 },
        );
      if (error.keyPattern?.asin)
        return NextResponse.json(
          { error: "A deal with this ASIN already exists." },
          { status: 409 },
        );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create Amazon deal." },
      { status: 400 },
    );
  }
}
