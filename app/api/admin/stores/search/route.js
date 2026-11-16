import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import Store from "@/app/models/store";
import Coupon from "@/app/models/coupon";
import Blog from "@/app/models/blog";
import Category from "@/app/models/category";
import User from "@/app/models/user";
import Country from "@/app/models/country";
import AffiliateNetwork from "@/app/models/affiliateNetwork";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const q = (searchParams.get("q") || "").trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get("limit") || DEFAULT_LIMIT, 10)));
    
    const categoryId = searchParams.get("primaryCategoryId");
    const countryId = searchParams.get("countryId");
    const affiliateNetworkId = searchParams.get("affiliateNetworkId");
    const isActive = searchParams.get("isActive");
    const isFeatured = searchParams.get("isFeatured");

    await connectDB();

    // 1. Build optimized query filter matching schema fields
    const queryFilter = {};

    if (q) {
      // Fast anchored/unanchored case-insensitive regex utilizing text indices or indexes
      const safeQuery = escapeRegExp(q);
      queryFilter.$or = [
        { name: { $regex: safeQuery, $options: "i" } },
        { slug: { $regex: safeQuery, $options: "i" } },
        { officialUrl: { $regex: safeQuery, $options: "i" } },
      ];
    }

    if (categoryId) queryFilter.primaryCategoryId = categoryId;
    if (countryId) queryFilter.countryId = countryId;
    if (affiliateNetworkId) queryFilter.affiliateNetworkId = affiliateNetworkId;
    
    if (isActive === "true") queryFilter.isActive = true;
    if (isActive === "false") queryFilter.isActive = false;

    if (isFeatured === "true") queryFilter.isFeatured = true;
    if (isFeatured === "false") queryFilter.isFeatured = false;

    const skip = (page - 1) * limit;

    // 2. Execute parallel count and paginated find queries for maximum efficiency
    const [stores, total] = await Promise.all([
      Store.find(queryFilter)
        .populate("primaryCategoryId", "name slug")
        .populate("countryId", "name code")
        .populate("affiliateNetworkId", "name")
        .sort({ isFeatured: -1, featuredOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .maxTimeMS(4000),
      Store.countDocuments(queryFilter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json(
      {
        success: true,
        stores,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasMore: page < totalPages,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/admin/stores/search Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stores quickly." },
      { status: 500 }
    );
  }
}