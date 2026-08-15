/**
 * @route   GET /api/public/categories/[slug]
 * @desc    Hybrid Category Listing Page — Products, Stores, Child Categories
 * @access  Public
 *
 * ─── QUERY PARAMETERS ────────────────────────────────────────────────────────
 *
 *  Pagination
 *    page          {number}   Current page (default: 1)
 *    limit         {number}   Items per page (default: 20, max: 60)
 *
 *  Filtering
 *    q             {string}   Full-text search within products (title, brand)
 *    brand         {string}   Filter by brandName (case-insensitive)
 *    minPrice      {number}   Minimum price filter
 *    maxPrice      {number}   Maximum price filter
 *    minRating     {number}   Minimum rating (1–5)
 *    minDiscount   {number}   Minimum discount percentage (0–100)
 *    hotDeals      {boolean}  true = only isHotDeal products
 *    topPicks      {boolean}  true = only isTopPick products
 *    variant       {string}   Filter by displayVariant enum value
 *
 *  Sorting
 *    sort          {string}   One of:
 *                               featured   — isTopPick desc, sortOrder asc (default)
 *                               price_asc  — price ascending
 *                               price_desc — price descending
 *                               discount   — discountPercentage descending
 *                               rating     — rating descending
 *                               newest     — createdAt descending
 *
 *  Scope
 *    deep          {boolean}  true = include products from ALL descendant categories
 *                             (auto-enabled for L0 parent categories)
 *
 * ─── RESPONSE SHAPE ──────────────────────────────────────────────────────────
 *
 *  {
 *    success: true,
 *    data: {
 *      category,           // Full category doc + populated ancestors (breadcrumbs)
 *      hierarchy: {
 *        childCategories,  // Direct children (pills / sidebar)
 *        siblingCategories // Same-parent siblings (tab navigation)
 *      },
 *      heroProducts,       // Top-pick / hero-spotlight (non-paginated, max 5)
 *      products: {
 *        items,
 *        filters: {
 *          applied,        // Echo of all active filters
 *          available: {
 *            brands,       // Distinct brand names in this category scope
 *            priceRange,   // { min, max } for price slider
 *          }
 *        },
 *        pagination
 *      },
 *      stores: {
 *        curated,          // category.bestStores (manually curated, populated)
 *        related           // Active stores that list this category
 *      },
 *      meta: {
 *        scope,            // "exact" | "deep" — which product scope was used
 *        categoryIds,      // All category _ids used in product query
 *        resolvedAt        // ISO timestamp
 *      }
 *    }
 *  }
 */

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/app/lib/mongodb";
import Category from "@/app/models/category";
import Store from "@/app/models/store";
import AffiliateProduct from "@/app/models/affiliateProduct";

// ─── Constants ────────────────────────────────────────────────────────────────

const PRODUCT_LIMIT_MAX = 60;
const PRODUCT_LIMIT_DEFAULT = 20;
const STORE_LIMIT = 12;
const HERO_PRODUCT_LIMIT = 5;

const SORT_MAP = {
  featured: { isTopPick: -1, sortOrder: 1, discountPercentage: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  discount: { discountPercentage: -1 },
  rating: { rating: -1, reviewCount: -1 },
  newest: { createdAt: -1 },
};

const VALID_VARIANTS = [
  "standard",
  "featured_horizontal",
  "compact_grid",
  "hero_spotlight",
];

// ─── Field Projections ────────────────────────────────────────────────────────

// 🔥 ADDED 'type' to ensure the module type is passed to the frontend
const CATEGORY_SELECT =
  "name slug type shortDescription description icon image uiConfig aggregateRating level parentId ancestors bestStores seo";

const PRODUCT_CARD_SELECT =
  "title slug shortDescription brandName expertScore ribbonText pros bottomLine awardBadge images price originalPrice discountPercentage currency affiliateLink ctaText displayVariant isTopPick isTrending isHotDeal rating reviewCount lastVerifiedAt sortOrder";

const STORE_CARD_SELECT =
  "name slug images.logo images.thumb content.shortDescription isFeatured featuredOrder facts.foundedYear";

// 🔥 ADDED 'type' here as well
const CHILD_CATEGORY_SELECT = "name slug type icon shortDescription sortOrder";

// ─── Utility Functions ────────────────────────────────────────────────────────

function jsonError(message, status = 500) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function normalizeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
}

function parsePositiveInt(value, fallback, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return max ? Math.min(parsed, max) : parsed;
}

function parsePositiveFloat(value, fallback = null) {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function parseBool(value) {
  return value === "true" || value === "1";
}

/**
 * Parse and validate all query parameters into a strongly-typed config object.
 */
function parseQueryParams(searchParams) {
  const raw = {
    page: searchParams.get("page"),
    limit: searchParams.get("limit"),
    q: searchParams.get("q")?.trim() || "",
    brand: searchParams.get("brand")?.trim() || "",
    minPrice: searchParams.get("minPrice"),
    maxPrice: searchParams.get("maxPrice"),
    minRating: searchParams.get("minRating"),
    minDiscount: searchParams.get("minDiscount"),
    hotDeals: searchParams.get("hotDeals"),
    topPicks: searchParams.get("topPicks"),
    variant: searchParams.get("variant")?.trim() || "",
    sort: searchParams.get("sort")?.trim() || "featured",
    deep: searchParams.get("deep"),
  };

  const page = parsePositiveInt(raw.page, 1);
  const limit = parsePositiveInt(
    raw.limit,
    PRODUCT_LIMIT_DEFAULT,
    PRODUCT_LIMIT_MAX,
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    q: raw.q.substring(0, 100), // Prevent excessive text search strings
    brand: raw.brand.substring(0, 100),
    minPrice: parsePositiveFloat(raw.minPrice),
    maxPrice: parsePositiveFloat(raw.maxPrice),
    minRating: parsePositiveFloat(raw.minRating),
    minDiscount: parsePositiveFloat(raw.minDiscount),
    hotDeals: parseBool(raw.hotDeals),
    topPicks: parseBool(raw.topPicks),
    variant: VALID_VARIANTS.includes(raw.variant) ? raw.variant : "",
    sort: Object.keys(SORT_MAP).includes(raw.sort) ? raw.sort : "featured",
    deep: parseBool(raw.deep),
  };
}

// ─── Build Product Filter ─────────────────────────────────────────────────────

/**
 * Compose the Mongoose query filter for products from validated params.
 * categoryIds is an array — either [category._id] for exact scope,
 * or [category._id, ...allDescendantIds] for deep scope.
 */
function buildProductFilter(categoryIds, params) {
  const filter = {
    categoryId: { $in: categoryIds },
    showInCategoryPage: true,
  };

  // Full-text search (title + brand — uses text index on model)
  if (params.q) {
    filter.$text = { $search: params.q };
  }

  // Brand filter (case-insensitive regex for partial match)
  if (params.brand) {
    filter.brandName = { $regex: new RegExp(params.brand, "i") };
  }

  // Price range
  if (params.minPrice !== null || params.maxPrice !== null) {
    filter.price = {};
    if (params.minPrice !== null) filter.price.$gte = params.minPrice;
    if (params.maxPrice !== null) filter.price.$lte = params.maxPrice;
  }

  // Rating floor
  if (params.minRating !== null) {
    filter.rating = { $gte: params.minRating };
  }

  // Discount floor
  if (params.minDiscount !== null) {
    filter.discountPercentage = { $gte: params.minDiscount };
  }

  // Boolean flags
  if (params.hotDeals) filter.isHotDeal = true;
  if (params.topPicks) filter.isTopPick = true;

  // Display variant
  if (params.variant) filter.displayVariant = params.variant;

  return filter;
}

// ─── Resolve Category Scope ───────────────────────────────────────────────────

/**
 * Determine which category IDs to include in the product query.
 *
 * - L0 category: Always deep (includes all L1 + L2 descendants automatically)
 * - L1/L2 + deep=true: Include all descendant IDs
 * - L1/L2 + deep=false (default): Exact match only
 *
 * Returns { categoryIds: ObjectId[], scope: "exact" | "deep" }
 */
async function resolveCategoryScope(category, params) {
  const isRootCategory = category.level === 0;
  const useDeepScope = isRootCategory || params.deep;

  if (!useDeepScope) {
    return { categoryIds: [category._id], scope: "exact" };
  }

  // 🔥 ADDED: type: category.type strictly enforces Taxonomy Module boundaries
  // Prevents fetching products from a 'blog' category accidentally nested under a 'store' category
  const descendants = await Category.find(
    { ancestors: category._id, status: "active", type: category.type },
    { _id: 1 },
  ).lean();

  const categoryIds = [category._id, ...descendants.map((d) => d._id)];

  return { categoryIds, scope: "deep" };
}

// ─── Fetch Available Filters (for frontend filter panel) ─────────────────────

/**
 * Returns distinct brands and price range from the full (unfiltered) product set
 * within the resolved category scope. This powers the sidebar filter panel.
 *
 * Using aggregation so we get accurate data in a single DB round-trip.
 */
async function fetchAvailableFilters(categoryIds) {
  const [result] = await AffiliateProduct.aggregate([
    {
      $match: {
        categoryId: { $in: categoryIds },
        showInCategoryPage: true,
      },
    },
    {
      $group: {
        _id: null,
        brands: { $addToSet: "$brandName" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
    {
      $project: {
        _id: 0,
        brands: {
          $filter: {
            input: { $sortArray: { input: "$brands", sortBy: 1 } },
            as: "b",
            cond: { $and: [{ $ne: ["$$b", null] }, { $ne: ["$$b", ""] }] },
          },
        },
        minPrice: 1,
        maxPrice: 1,
      },
    },
  ]);

  return result
    ? {
        brands: result.brands || [],
        priceRange: {
          min: result.minPrice ?? 0,
          max: result.maxPrice ?? 0,
        },
      }
    : { brands: [], priceRange: { min: 0, max: 0 } };
}

// ─── GET Handler ──────────────────────────────────────────────────────────────

export async function GET(req, { params }) {
  try {
    // ── 1. DB Connection ──────────────────────────────────────────────────
    await connectDB();

    // ── 2. Parse & Validate Inputs ────────────────────────────────────────
    const resolvedParams = await params;
    const slug = normalizeSlug(resolvedParams.slug);

    if (!slug) return jsonError("Category slug is required.", 400);

    const { searchParams } = new URL(req.url);
    const qp = parseQueryParams(searchParams);

    // ── 3. Fetch Category ─────────────────────────────────────────────────
    const category = await Category.findOne({ slug, status: "active" })
      .select(CATEGORY_SELECT)
      .populate("ancestors", "name slug level type") // Breadcrumbs updated with type
      .populate({
        path: "bestStores",
        select: STORE_CARD_SELECT,
        match: { isActive: true },
        options: { limit: 10 },
      })
      .lean();

    if (!category) {
      return jsonError("Category not found or is inactive.", 404);
    }

    // ── 4. Resolve Scope (which category IDs to query) ────────────────────
    const { categoryIds, scope } = await resolveCategoryScope(category, qp);

    // ── 5. Build Product Filter ───────────────────────────────────────────
    const productFilter = buildProductFilter(categoryIds, qp);

    // Hero filter: top picks / spotlights — always fetched without user filters
    // so the hero section is consistent regardless of applied filters.
    const heroFilter = {
      categoryId: { $in: categoryIds },
      showInCategoryPage: true,
      $or: [{ isTopPick: true }, { displayVariant: "hero_spotlight" }],
    };

    // Sort config
    const sortConfig = SORT_MAP[qp.sort];

    // ── 6. Parallel Data Fetch ────────────────────────────────────────────
    const [
      products,
      totalProducts,
      heroProducts,
      childCategories,
      siblingCategories,
      relatedStores,
      availableFilters,
    ] = await Promise.all([
      // A — Paginated product grid (with user filters applied)
      AffiliateProduct.find(productFilter)
        .select(PRODUCT_CARD_SELECT)
        .populate("storeId", "name slug images.logo")
        .sort(sortConfig)
        .skip(qp.skip)
        .limit(qp.limit)
        .lean(),

      // B — Total count for pagination (same filter, no skip/limit)
      AffiliateProduct.countDocuments(productFilter),

      // C — Hero products (no user filter — always stable)
      AffiliateProduct.find(heroFilter)
        .select(PRODUCT_CARD_SELECT)
        .populate("storeId", "name slug images.logo")
        .sort({ sortOrder: 1 })
        .limit(HERO_PRODUCT_LIMIT)
        .lean(),

      // D — Direct child categories (strictly same module type)
      Category.find({
        parentId: category._id,
        status: "active",
        type: category.type,
      })
        .select(CHILD_CATEGORY_SELECT)
        .sort({ sortOrder: 1 })
        .lean(),

      // E — Sibling categories (strictly same module type & exclude current)
      category.parentId
        ? Category.find({
            parentId: category.parentId,
            status: "active",
            type: category.type,
            _id: { $ne: category._id },
          })
            .select(CHILD_CATEGORY_SELECT)
            .sort({ sortOrder: 1 })
            .limit(12)
            .lean()
        : Promise.resolve([]),

      // F — Related stores (primary OR secondary category match)
      Store.find({
        $or: [
          { primaryCategoryId: { $in: categoryIds } },
          { subCategoryIds: { $in: categoryIds } },
        ],
        isActive: true,
      })
        .select(STORE_CARD_SELECT)
        .sort({ isFeatured: -1, featuredOrder: 1, name: 1 })
        .limit(STORE_LIMIT)
        .lean(),

      // G — Available filter options (brands + price range)
      fetchAvailableFilters(categoryIds),
    ]);

    // ── 7. Build Applied Filters Echo ─────────────────────────────────────
    // Tell the frontend exactly which filters are active so it can
    // render filter chips / clear buttons without re-parsing the URL.
    const appliedFilters = {
      ...(qp.q && { q: qp.q }),
      ...(qp.brand && { brand: qp.brand }),
      ...(qp.minPrice !== null && { minPrice: qp.minPrice }),
      ...(qp.maxPrice !== null && { maxPrice: qp.maxPrice }),
      ...(qp.minRating !== null && { minRating: qp.minRating }),
      ...(qp.minDiscount !== null && { minDiscount: qp.minDiscount }),
      ...(qp.hotDeals && { hotDeals: true }),
      ...(qp.topPicks && { topPicks: true }),
      ...(qp.variant && { variant: qp.variant }),
      sort: qp.sort,
    };

    const hasActiveFilters = Object.keys(appliedFilters).some(
      (k) => k !== "sort",
    );

    // ── 8. Compose Response ───────────────────────────────────────────────
    const responsePayload = {
      success: true,
      data: {
        // Category details + ancestors for breadcrumbs
        category,

        // Sub-navigation hierarchy (Filtered strictly by module type)
        hierarchy: {
          childCategories,
          siblingCategories,
        },

        // Hero / spotlight section (stable, not affected by filters)
        heroProducts,

        // Paginated product grid
        products: {
          items: products,
          filters: {
            applied: appliedFilters,
            hasActiveFilters,
            available: availableFilters,
          },
          pagination: {
            total: totalProducts,
            page: qp.page,
            limit: qp.limit,
            totalPages: Math.ceil(totalProducts / qp.limit),
            hasNextPage: qp.page * qp.limit < totalProducts,
            hasPrevPage: qp.page > 1,
            from: totalProducts === 0 ? 0 : qp.skip + 1,
            to: Math.min(qp.skip + qp.limit, totalProducts),
          },
        },

        // Stores section
        stores: {
          // Manually curated best stores from category.bestStores (already populated above)
          curated: category.bestStores ?? [],
          // Stores that organically list this category
          related: relatedStores,
        },

        // Request metadata
        meta: {
          scope, // "exact" | "deep"
          categoryIds: categoryIds.map(String),
          resolvedAt: new Date().toISOString(),
        },
      },
    };

    // ── 9. Return with Cache Headers ──────────────────────────────────────
    //
    // Cache strategy:
    //   - Filtered / searched requests: short TTL (60s) — data is user-specific
    //   - Unfiltered default listing:   aggressive CDN cache (5min + 30min SWR)
    //
    const isFilteredRequest = hasActiveFilters || qp.page > 1;

    const cacheControl = isFilteredRequest
      ? "public, s-maxage=60, stale-while-revalidate=120"
      : "public, s-maxage=300, stale-while-revalidate=1800";

    return NextResponse.json(responsePayload, {
      status: 200,
      headers: {
        "Cache-Control": cacheControl,
        "X-Category-Scope": scope,
        "X-Category-Level": String(category.level),
        "X-Category-Type": String(category.type || "general"),
      },
    });
  } catch (error) {
    console.error("[GET /api/public/categories/[slug]]", error);

    // Distinguish validation errors from server errors for better DX
    if (error.name === "CastError") {
      return jsonError("Invalid identifier format.", 400);
    }

    return jsonError(
      "A server error occurred while fetching category data.",
      500,
    );
  }
}
