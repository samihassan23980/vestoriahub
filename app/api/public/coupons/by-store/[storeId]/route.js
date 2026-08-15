/* app/api/public/coupons/by-store/[storeId]/route.js */
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/app/lib/mongodb";
import Coupon from "@/app/models/coupon";
import "@/app/models/category";

function toPositiveNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : fallback;
}

export async function GET(req, { params }) {
  try {
    await connectDB();

    const { storeId } = await params;

    if (!mongoose.Types.ObjectId.isValid(storeId)) {
      return NextResponse.json({ error: "Invalid store ID." }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);

    const page = toPositiveNumber(searchParams.get("page"), 1);
    const limit = Math.min(
      toPositiveNumber(searchParams.get("limit"), 50),
      100,
    );

    const countryCode = (
      searchParams.get("countryCode") || "GLOBAL"
    ).toUpperCase();

    const type = searchParams.get("type");
    const discountType = searchParams.get("discountType");
    const isExclusive = searchParams.get("isExclusive");
    const isVerified = searchParams.get("isVerified");

    const query = {
      storeId,
      status: "active",
    };

    if (countryCode !== "GLOBAL") {
      query.countryCode = { $in: [countryCode, "GLOBAL"] };
    } else {
      query.countryCode = "GLOBAL";
    }

    if (type) query.type = type;
    if (discountType) query.discountType = discountType;
    if (isExclusive === "true") query.isExclusive = true;
    if (isVerified === "true") query.isVerified = true;

    const skip = (page - 1) * limit;

    const [coupons, total] = await Promise.all([
      Coupon.find(query)
        .populate("categoryId", "name slug")
        .populate("secondaryCategoryIds", "name slug")
        .sort({ isPinned: -1, sortOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Coupon.countDocuments(query),
    ]);

    return NextResponse.json(
      {
        coupons,
        total,
        page,
        limit,
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
    console.error("GET /public/coupons/by-store/[storeId] Error:", error);

    return NextResponse.json(
      { error: "Failed to fetch store coupons." },
      { status: 500 },
    );
  }
}
