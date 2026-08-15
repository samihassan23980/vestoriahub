import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/app/lib/mongodb";
import AffiliateProduct from "@/app/models/affiliateProduct";
import Category from "@/app/models/category";

export const dynamic = "force-dynamic";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export async function GET(req, { params }) {
  try {
    await connectDB();

    // ── 1. Next.js 15 Async Params Unwrapping ──────────────────────────────
    const resolvedParams = await params;
    const categoryId = resolvedParams?.categoryId;

    if (!categoryId || !isValidObjectId(categoryId)) {
      return NextResponse.json(
        { success: false, error: "Invalid category ID." },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "24", 10);
    const safeLimit = Math.min(Math.max(limit, 1), 60);

    // ── 2. Fetch Category with Correct Schema Projection ───────────────────
    const category = await Category.findById(categoryId)
      .select("name slug description image uiConfig seo icon level ancestors status")
      .lean();

    if (!category || category.status !== "active") {
      return NextResponse.json(
        { success: false, error: "Category not found or inactive." },
        { status: 404 },
      );
    }

    // ── 3. Hierarchy Resolution (Include Subcategories) ─────────────────────
    const childCategories = await Category.find({ ancestors: category._id })
      .select("_id")
      .lean();

    const categoryIds = [category._id, ...childCategories.map((c) => c._id)];

    // ── 4. Base Query (Aligned with AffiliateProduct Schema) ──────────────
    const baseQuery = {
      categoryId: { $in: categoryIds },
      showInCategoryPage: true,
    };

    // ── 5. Parallel Execution ──────────────────────────────────────────────
    const [topPicks, hotDeals, trending, allProducts] = await Promise.all([
      AffiliateProduct.find({
        ...baseQuery,
        isTopPick: true,
      })
        .populate("storeId", "name slug logo")
        .populate("categoryId", "name slug")
        .sort({ sortOrder: 1, expertScore: -1, createdAt: -1 })
        .limit(8)
        .lean(),

      AffiliateProduct.find({
        ...baseQuery,
        isHotDeal: true,
      })
        .populate("storeId", "name slug logo")
        .populate("categoryId", "name slug")
        .sort({ discountPercentage: -1, sortOrder: 1, createdAt: -1 })
        .limit(12)
        .lean(),

      AffiliateProduct.find({
        ...baseQuery,
        isTrending: true,
      })
        .populate("storeId", "name slug logo")
        .populate("categoryId", "name slug")
        .sort({ sortOrder: 1, reviewCount: -1, createdAt: -1 })
        .limit(12)
        .lean(),

      AffiliateProduct.find(baseQuery)
        .populate("storeId", "name slug logo")
        .populate("categoryId", "name slug")
        .sort({
          isTopPick: -1,
          isHotDeal: -1,
          isTrending: -1,
          sortOrder: 1,
          createdAt: -1,
        })
        .limit(safeLimit)
        .lean(),
    ]);

    return NextResponse.json(
      {
        success: true,
        category,
        sections: {
          topPicks,
          hotDeals,
          trending,
          allProducts,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    console.error(
      "GET /public/affiliate-products/category/[categoryId] Error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch category affiliate products.",
      },
      { status: 500 },
    );
  }
}