/* app/api/public/coupons/route.js */
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/app/lib/mongodb";
import Coupon from "@/app/models/coupon";
import "@/app/models/store";
import "@/app/models/category";

function toPositiveNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : fallback;
}

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const page = toPositiveNumber(searchParams.get("page"), 1);
    const limit = Math.min(
      toPositiveNumber(searchParams.get("limit"), 20),
      100,
    );

    const countryCode = (
      searchParams.get("countryCode") || "GLOBAL"
    ).toUpperCase();

    const storeId = searchParams.get("storeId");
    const categoryId = searchParams.get("categoryId");
    const type = searchParams.get("type");
    const discountType = searchParams.get("discountType");
    const isExclusive = searchParams.get("isExclusive");
    const isVerified = searchParams.get("isVerified");

    const query = {
      status: "active",
    };

    if (countryCode !== "GLOBAL") {
      query.countryCode = { $in: [countryCode, "GLOBAL"] };
    } else {
      query.countryCode = "GLOBAL";
    }

    if (storeId && mongoose.Types.ObjectId.isValid(storeId)) {
      query.storeId = storeId;
    }

    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      query.$or = [{ categoryId }, { secondaryCategoryIds: categoryId }];
    }

    if (type) query.type = type;
    if (discountType) query.discountType = discountType;
    if (isExclusive === "true") query.isExclusive = true;
    if (isVerified === "true") query.isVerified = true;

    const skip = (page - 1) * limit;

    const [coupons, total] = await Promise.all([
      Coupon.find(query)
        .populate("storeId", "name slug images.logo")
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
    console.error("GET /public/coupons Error:", error);

    return NextResponse.json(
      { error: "Failed to fetch coupons." },
      { status: 500 },
    );
  }
}
