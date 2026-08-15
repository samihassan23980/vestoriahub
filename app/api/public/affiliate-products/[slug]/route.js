import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import AffiliateProduct from "@/app/models/affiliateProduct";
import Category from "@/app/models/category";
import Store from "@/app/models/store";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  try {
    await connectDB();

    // ── 1. Next.js 15 Async Params Unwrapping ──────────────────────────────
    const resolvedParams = await params;
    const slug = resolvedParams?.slug;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Product slug is required." },
        { status: 400 },
      );
    }

    const cleanSlug = String(slug).trim().toLowerCase();

    // ── 2. Fetch Main Product Document ─────────────────────────────────────
    // Note: Removed non-existent 'status: "published"' filter
    const product = await AffiliateProduct.findOne({ slug: cleanSlug })
      .populate("categoryId", "name slug icon uiConfig.themeColor ancestors")
      .populate("storeId", "name slug logo website")
      .lean();

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Affiliate product not found." },
        { status: 404 },
      );
    }

    // ── 3. Fetch Related Products (Same Category) ──────────────────────────
    const relatedProducts = await AffiliateProduct.find({
      categoryId: product.categoryId?._id || product.categoryId,
      _id: { $ne: product._id },
      showInCategoryPage: true,
    })
      .populate("storeId", "name slug logo")
      .populate("categoryId", "name slug")
      .sort({ isTopPick: -1, sortOrder: 1, createdAt: -1 })
      .limit(6)
      .lean();

    return NextResponse.json(
      {
        success: true,
        product,
        relatedProducts,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    console.error("GET /public/affiliate-products/[slug] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch affiliate product.",
      },
      { status: 500 },
    );
  }
}