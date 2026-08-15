/* app/api/public/affiliate-products/route.js */
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/app/lib/mongodb";
import Category from "@/app/models/category";
import Store from "@/app/models/store";
import AffiliateProduct from "@/app/models/affiliateProduct";

// Enable Next.js ISR (Incremental Static Regeneration) caching for this API endpoint
// This caches the API response for 60 seconds, drastically reducing database load.
export const revalidate = 60;
export const dynamic = "force-dynamic";
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    // ─── 1. Determine Response Type (Grouped Dashboard vs List) ─────────────
    // If frontend sends ?view=grouped, return structured data for Home/Dashboard
    const viewMode = searchParams.get("view");

    if (viewMode === "grouped") {
      const [topPicks, hotDeals, trending, recent] = await Promise.all([
        AffiliateProduct.find({ isTopPick: true })
          .populate("categoryId", "name slug icon uiConfig.themeColor")
          .sort({ sortOrder: 1, createdAt: -1 })
          .limit(4)
          .lean(),
        AffiliateProduct.find({
          isHotDeal: true,
          discountPercentage: { $gte: 15 },
        })
          .populate("categoryId", "name slug icon uiConfig.themeColor")
          .sort({ discountPercentage: -1 })
          .limit(6)
          .lean(),
        AffiliateProduct.find({ isTrending: true })
          .populate("categoryId", "name slug icon uiConfig.themeColor")
          .sort({ rating: -1, reviewCount: -1 })
          .limit(6)
          .lean(),
        AffiliateProduct.find({ showInCategoryPage: true })
          .populate("categoryId", "name slug icon uiConfig.themeColor")
          .sort({ createdAt: -1 })
          .limit(8)
          .lean(),
      ]);

      return NextResponse.json(
        {
          success: true,
          data: {
            heroSpotlight: topPicks, // Best for large Page 1 style cards
            flashDeals: hotDeals, // Best for horizontal scrollable ribbons
            trendingNow: trending, // Best for compact grid
            newArrivals: recent, // Best for standard layout
          },
        },
        { status: 200 },
      );
    }

    // ─── 2. Standard Paginated & Filtered Listing ───────────────────────────
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "12", 10), 50);
    const skip = (page - 1) * limit;

    // Filters
    const categorySlug = searchParams.get("categorySlug");
    const categoryId = searchParams.get("categoryId");
    const storeId = searchParams.get("storeId");
    const displayVariant = searchParams.get("displayVariant");
    const sortParams = searchParams.get("sort"); // e.g., 'price_asc', 'discount_desc', 'rating'

    let query = {};

    // Filter by Category (Supports both ID and Slug for SEO-friendly URLs)
    if (categoryId && isValidObjectId(categoryId)) {
      query.categoryId = categoryId;
    } else if (categorySlug) {
      const category = await Category.findOne({ slug: categorySlug })
        .select("_id")
        .lean();
      if (!category) {
        return NextResponse.json(
          { success: true, data: [], pagination: {} },
          { status: 200 },
        );
      }
      query.categoryId = category._id;
    }

    if (storeId && isValidObjectId(storeId)) query.storeId = storeId;
    if (displayVariant) query.displayVariant = displayVariant;

    // Only show products meant for category pages unless explicitly bypassed
    if (searchParams.get("showInCategoryPage") !== "false") {
      query.showInCategoryPage = true;
    }

    // Sorting Logic
    let sortObj = { isTopPick: -1, sortOrder: 1, createdAt: -1 }; // Default
    if (sortParams === "price_asc") sortObj = { price: 1 };
    if (sortParams === "price_desc") sortObj = { price: -1 };
    if (sortParams === "discount_desc") sortObj = { discountPercentage: -1 };
    if (sortParams === "rating_desc") sortObj = { expertScore: -1, rating: -1 };
    if (sortParams === "newest") sortObj = { createdAt: -1 };

    // Execute Query
    const [products, total] = await Promise.all([
      AffiliateProduct.find(query)
        .populate("categoryId", "name slug icon uiConfig.themeColor")
        .populate("storeId", "name slug logo")
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      AffiliateProduct.countDocuments(query),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: products,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /public/affiliate-products Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load products. Please try again later.",
      },
      { status: 500 },
    );
  }
}
