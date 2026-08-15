import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import AffiliateProduct from "@/app/models/affiliateProduct";
import Category from "@/app/models/category";

export async function GET(req, { params }) {
  try {
    await connectDB();

    const { slug } = params;
    const { searchParams } = new URL(req.url);

    const limit = parseInt(searchParams.get("limit"), 10) || 24;
    const safeLimit = Math.min(Math.max(limit, 1), 60);

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Category slug is required." },
        { status: 400 },
      );
    }

    const category = await Category.findOne({
      slug: String(slug).trim().toLowerCase(),
    })
      .select("name slug description image seoTitle seoDescription")
      .lean();

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category not found." },
        { status: 404 },
      );
    }

    const baseQuery = {
      categoryId: category._id,
      status: "published",
      showInCategoryPage: true,
    };

    const [topPicks, hotDeals, trending, allProducts] = await Promise.all([
      AffiliateProduct.find({
        ...baseQuery,
        isTopPick: true,
      })
        .populate("storeId", "name slug logo")
        .sort({ sortOrder: 1, expertScore: -1, createdAt: -1 })
        .limit(8)
        .lean(),

      AffiliateProduct.find({
        ...baseQuery,
        isHotDeal: true,
      })
        .populate("storeId", "name slug logo")
        .sort({ discountPercentage: -1, sortOrder: 1, createdAt: -1 })
        .limit(12)
        .lean(),

      AffiliateProduct.find({
        ...baseQuery,
        isTrending: true,
      })
        .populate("storeId", "name slug logo")
        .sort({ sortOrder: 1, reviewCount: -1, createdAt: -1 })
        .limit(12)
        .lean(),

      AffiliateProduct.find(baseQuery)
        .populate("storeId", "name slug logo")
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
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "GET /public/affiliate-products/category-slug/[slug] Error:",
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
