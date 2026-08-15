import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/app/lib/mongodb";
import Blog from "@/app/models/blog";
import Category from "@/app/models/category";

// ─── Constants ────────────────────────────────────────────────────────────────

const BLOG_LIMIT_DEFAULT = 12;
const BLOG_LIMIT_MAX = 48;
const FEATURED_LIMIT = 5;

// Tightened projections — only what each consumer actually renders
const CATEGORY_SELECT =
  "name slug type shortDescription description icon image uiConfig level parentId ancestors seo aggregateRating";

const CHILD_CATEGORY_SELECT =
  "name slug type icon shortDescription sortOrder level";

const BLOG_CARD_SELECT =
  "title slug excerpt featuredImage category tags author viewCount readTimeMinutes publishedAt createdAt seo.metaTitle seo.metaDescription";

const FEATURED_BLOG_SELECT =
  "title slug excerpt featuredImage category tags author viewCount readTimeMinutes publishedAt";

// Minimal populate projection — don't pull full category docs
const CATEGORY_REF_SELECT = "name slug type";
const ANCESTOR_SELECT = "name slug level type";

// ─── Sorting ──────────────────────────────────────────────────────────────────

const SORT_MAP = {
  newest: { publishedAt: -1 },
  oldest: { publishedAt: 1 },
  popular: { viewCount: -1, publishedAt: -1 },
  read_time_asc: { readTimeMinutes: 1, publishedAt: -1 },
  read_time_desc: { readTimeMinutes: -1, publishedAt: -1 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function parseBool(value) {
  return value === "true" || value === "1";
}

function parseQueryParams(searchParams) {
  const rawPage = searchParams.get("page");
  const rawLimit = searchParams.get("limit");
  const rawSort = searchParams.get("sort")?.trim() || "newest";
  const rawQ = searchParams.get("q")?.trim() || "";
  const rawTag = searchParams.get("tag")?.trim() || "";
  const rawAuthor = searchParams.get("author")?.trim() || "";
  const rawDeep = searchParams.get("deep");

  const page = parsePositiveInt(rawPage, 1);
  const limit = parsePositiveInt(rawLimit, BLOG_LIMIT_DEFAULT, BLOG_LIMIT_MAX);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    q: rawQ.substring(0, 100),
    tag: rawTag.substring(0, 60).toLowerCase(),
    // Sanitize author: strip regex special chars to avoid ReDoS
    author: rawAuthor.substring(0, 120).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    sort: SORT_MAP[rawSort] ? rawSort : "newest",
    deep: parseBool(rawDeep),
  };
}

// ─── Category Scope ───────────────────────────────────────────────────────────
// NOTE: Add a MongoDB index for fast ancestor lookups:
//   db.categories.createIndex({ ancestors: 1, status: 1, type: 1 })

async function resolveDescendantIds(category) {
  // Only _id needed — lean + minimal projection
  const descendants = await Category.find(
    { ancestors: category._id, status: "active", type: category.type },
    { _id: 1 },
  ).lean();
  return descendants.map((d) => d._id);
}

// ─── Blog Filter ──────────────────────────────────────────────────────────────

function buildBlogFilter(categoryIds, qp) {
  const now = new Date();
  const filter = {
    category: { $in: categoryIds },
    status: "published",
    publishedAt: { $lte: now },
  };

  if (qp.q) filter.$text = { $search: qp.q };
  if (qp.tag) filter.tags = qp.tag;
  // Prefix-anchored regex is index-friendly; escaped above against ReDoS
  if (qp.author)
    filter["author.name"] = { $regex: new RegExp(`^${qp.author}`, "i") };

  return filter;
}

// ─── Available Filters Aggregation ───────────────────────────────────────────
// NOTE: This aggregation is expensive. Add a compound index:
//   db.blogs.createIndex({ category: 1, status: 1, publishedAt: -1 })
// For high-traffic sites, move this to a scheduled job and cache the result
// in Redis/KV — the tag/author list rarely changes per minute.

async function fetchAvailableFilters(categoryIds) {
  const now = new Date();

  const [result] = await Blog.aggregate(
    [
      {
        $match: {
          category: { $in: categoryIds },
          status: "published",
          publishedAt: { $lte: now },
        },
      },
      {
        $group: {
          _id: null,
          tags: { $addToSet: "$tags" },
          authors: { $addToSet: "$author.name" },
          minReadTime: { $min: "$readTimeMinutes" },
          maxReadTime: { $max: "$readTimeMinutes" },
        },
      },
      {
        $project: {
          _id: 0,
          tags: {
            $setUnion: {
              $reduce: {
                input: "$tags",
                initialValue: [],
                in: { $concatArrays: ["$$value", "$$this"] },
              },
            },
          },
          authors: {
            $filter: {
              input: "$authors",
              as: "a",
              cond: { $and: [{ $ne: ["$$a", null] }, { $ne: ["$$a", ""] }] },
            },
          },
          readTimeRange: {
            min: { $ifNull: ["$minReadTime", 0] },
            max: { $ifNull: ["$maxReadTime", 0] },
          },
        },
      },
    ],
    // allowDiskUse only if category spans thousands of blogs; omit otherwise
    // { allowDiskUse: true },
  );

  return result
    ? {
        tags: [...(result.tags || [])].filter(Boolean).sort(),
        authors: [...(result.authors || [])].filter(Boolean).sort(),
        readTimeRange: result.readTimeRange || { min: 0, max: 0 },
      }
    : { tags: [], authors: [], readTimeRange: { min: 0, max: 0 } };
}

// ─── GET Handler ──────────────────────────────────────────────────────────────

export async function GET(req, { params }) {
  try {
    // connectDB should be idempotent (cached connection) — no overhead on warm calls
    await connectDB();

    const resolvedParams = await params;
    const slug = normalizeSlug(resolvedParams.slug);

    if (!slug) return jsonError("Category slug is required.", 400);

    const { searchParams } = new URL(req.url);
    const qp = parseQueryParams(searchParams);

    // ── 1. Fetch category (must resolve before we know scope) ──────────────
    // NOTE: Add index: db.categories.createIndex({ slug: 1, status: 1 })
    const category = await Category.findOne({ slug, status: "active" })
      .select(CATEGORY_SELECT)
      .populate("ancestors", ANCESTOR_SELECT)
      .lean();

    if (!category) return jsonError("Category not found or is inactive.", 404);

    // ── 2. Resolve scope — root categories always go deep ─────────────────
    const needsDeepScope = category.level === 0 || qp.deep;

    // Fetch descendants only when needed — skip the query entirely otherwise
    const descendantIds = needsDeepScope
      ? await resolveDescendantIds(category)
      : [];

    const categoryIds = [category._id, ...descendantIds];
    const scope = needsDeepScope ? "deep" : "exact";

    // ── 3. Build shared filter pieces ──────────────────────────────────────
    const blogFilter = buildBlogFilter(categoryIds, qp);
    const sortConfig = qp.q
      ? { score: { $meta: "textScore" }, publishedAt: -1 }
      : SORT_MAP[qp.sort];
    const projection = qp.q ? { score: { $meta: "textScore" } } : {};

    // Featured uses the same category scope but no user filters — separate filter
    const featuredFilter = {
      category: { $in: categoryIds },
      status: "published",
      publishedAt: { $lte: new Date() },
    };

    // ── 4. Fire all independent queries in parallel ────────────────────────
    // availableFilters is skipped when a search query is active (text search
    // already narrows results; filter panel is less useful and the aggregation
    // is expensive).
    const [
      blogs,
      totalBlogs,
      featuredBlogs,
      childCategories,
      siblingCategories,
      availableFilters,
    ] = await Promise.all([
      Blog.find(blogFilter, projection)
        .select(BLOG_CARD_SELECT)
        .populate("category", CATEGORY_REF_SELECT)
        .sort(sortConfig)
        .skip(qp.skip)
        .limit(qp.limit)
        .lean(),

      // countDocuments reuses the same index as find() — no extra collection scan
      Blog.countDocuments(blogFilter),

      Blog.find(featuredFilter)
        .select(FEATURED_BLOG_SELECT)
        .populate("category", CATEGORY_REF_SELECT)
        .sort({ viewCount: -1, publishedAt: -1 })
        .limit(FEATURED_LIMIT)
        .lean(),

      // NOTE: index: db.categories.createIndex({ parentId: 1, status: 1, type: 1, sortOrder: 1 })
      Category.find({
        parentId: category._id,
        status: "active",
        type: category.type,
      })
        .select(CHILD_CATEGORY_SELECT)
        .sort({ sortOrder: 1, name: 1 })
        .lean(),

      category.parentId
        ? Category.find({
            parentId: category.parentId,
            status: "active",
            type: category.type,
            _id: { $ne: category._id },
          })
            .select(CHILD_CATEGORY_SELECT)
            .sort({ sortOrder: 1, name: 1 })
            .limit(12)
            .lean()
        : Promise.resolve([]),

      // Skip heavy aggregation when user is doing a text search —
      // the filter sidebar is typically hidden in that UI state anyway
      qp.q
        ? Promise.resolve({
            tags: [],
            authors: [],
            readTimeRange: { min: 0, max: 0 },
          })
        : fetchAvailableFilters(categoryIds),
    ]);

    // ── 5. Build response ──────────────────────────────────────────────────
    const appliedFilters = {
      ...(qp.q && { q: qp.q }),
      ...(qp.tag && { tag: qp.tag }),
      ...(qp.author && { author: qp.author }),
      sort: qp.sort,
    };

    const hasActiveFilters = !!(qp.q || qp.tag || qp.author);

    const totalPages = Math.ceil(totalBlogs / qp.limit);

    const responsePayload = {
      success: true,
      data: {
        category,

        hierarchy: { childCategories, siblingCategories },

        featuredBlogs,

        blogs: {
          items: blogs,
          filters: {
            applied: appliedFilters,
            hasActiveFilters,
            available: availableFilters,
          },
          pagination: {
            total: totalBlogs,
            page: qp.page,
            limit: qp.limit,
            totalPages,
            hasNextPage: qp.page < totalPages,
            hasPrevPage: qp.page > 1,
            from: totalBlogs === 0 ? 0 : qp.skip + 1,
            to: Math.min(qp.skip + qp.limit, totalBlogs),
          },
        },

        meta: {
          scope,
          categoryIds: categoryIds.map(String),
          resolvedAt: new Date().toISOString(),
        },
      },
    };

    // ── 6. Cache headers ───────────────────────────────────────────────────
    // Filtered/paginated: shorter TTL. Base category page: long TTL.
    // Text search results: no public cache (highly variable, personalized).
    let cacheControl;
    if (qp.q) {
      cacheControl = "private, no-store";
    } else if (hasActiveFilters || qp.page > 1) {
      cacheControl = "public, s-maxage=120, stale-while-revalidate=300";
    } else {
      cacheControl = "public, s-maxage=600, stale-while-revalidate=3600";
    }

    return NextResponse.json(responsePayload, {
      status: 200,
      headers: {
        "Cache-Control": cacheControl,
        "X-Blog-Category-Scope": scope,
        "X-Blog-Category-Level": String(category.level),
        "X-Blog-Category-Type": String(category.type || "blog"),
      },
    });
  } catch (error) {
    console.error("[GET /api/public/blog-categories/[slug]]", error);

    if (
      error instanceof mongoose.Error.CastError ||
      error.name === "CastError"
    ) {
      return jsonError("Invalid identifier format.", 400);
    }

    return jsonError(
      "A server error occurred while fetching category blogs.",
      500,
    );
  }
}
