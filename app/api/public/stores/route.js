import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/app/lib/mongodb";
import Store from "@/app/models/store";
import Coupon from "@/app/models/coupon";

function jsonError(message, status = 500, details = null) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details ? { details } : {}),
    },
    { status },
  );
}

function parsePositiveInt(value, fallback, max = 100) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

function normalizeBooleanParam(value) {
  if (value === null || value === undefined || value === "") return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  return "INVALID";
}

function normalizeCountryCode(value) {
  const code = String(value || "GLOBAL")
    .trim()
    .toUpperCase();
  if (!code) return "GLOBAL";
  return code;
}

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const page = parsePositiveInt(searchParams.get("page"), 1);
    const limit = parsePositiveInt(searchParams.get("limit"), 24, 100);
    const skip = (page - 1) * limit;

    const countryCode = normalizeCountryCode(searchParams.get("countryCode"));
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search")?.trim() || "";
    const isFeaturedParam = normalizeBooleanParam(
      searchParams.get("isFeatured"),
    );

    if (isFeaturedParam === "INVALID") {
      return jsonError("isFeatured must be either true or false.", 400);
    }

    if (categoryId && !isValidObjectId(categoryId)) {
      return jsonError("categoryId must be a valid ObjectId.", 400);
    }

    const query = { isActive: true };

    if (countryCode !== "GLOBAL") {
      query.countryCode = { $in: [countryCode, "GLOBAL"] };
    } else {
      query.countryCode = "GLOBAL";
    }

    if (categoryId) query.primaryCategoryId = categoryId;
    if (typeof isFeaturedParam === "boolean")
      query.isFeatured = isFeaturedParam;
    if (search) query.$text = { $search: search };

    const projection = search ? { score: { $meta: "textScore" } } : {};
    let sort = search
      ? { score: { $meta: "textScore" }, name: 1 }
      : isFeaturedParam === true
        ? { featuredOrder: 1, createdAt: -1 }
        : { name: 1 };

    // 🔥 OPTIMIZATION 1: Only select what is needed for the grid cards
    const publicSelect = "name slug images.logo";

    // Fetch Stores and Total Count concurrently
    const [stores, total] = await Promise.all([
      Store.find(query, projection)
        .select(publicSelect)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Store.countDocuments(query),
    ]);

    if (!stores.length) {
      return NextResponse.json(
        {
          success: true,
          stores: [],
          pagination: { total: 0, page, limit, totalPages: 0 },
        },
        { status: 200 },
      );
    }

    // 🔥 OPTIMIZATION 2: Fast Aggregation to get coupon counts in ONE query
    const storeIds = stores.map((s) => s._id);

    const couponCounts = await Coupon.aggregate([
      {
        $match: {
          storeId: { $in: storeIds },
          status: "active", // Assumes your coupon model uses status: 'active' or isActive: true
        },
      },
      {
        $group: {
          _id: "$storeId",
          count: { $sum: 1 },
        },
      },
    ]);

    // Convert aggregate array into a fast O(1) lookup dictionary
    const countMap = couponCounts.reduce((acc, item) => {
      acc[String(item._id)] = item.count;
      return acc;
    }, {});

    // 🔥 OPTIMIZATION 3: Map the count directly into the store object
    const optimizedStores = stores.map((store) => ({
      _id: store._id,
      name: store.name,
      slug: store.slug,
      logo: store.images?.logo?.url || null, // Ensure fallback is smooth
      activeOffers: countMap[String(store._id)] || 0, // Adds "4 offers" count
    }));

    return NextResponse.json(
      {
        success: true,
        stores: optimizedStores,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    console.error("GET /api/public/stores Error:", error);
    if (error.name === "CastError") {
      return jsonError(`Invalid ${error.path}: ${error.value}`, 400);
    }
    return jsonError("Failed to fetch stores.", 500);
  }
}
