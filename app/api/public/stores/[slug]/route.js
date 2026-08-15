/**
 * GET /api/public/stores/[slug]
 *
 * Returns unified payload for the store landing page:
 * { store, coupons: { total, items }, similarStores }
 *
 * Fixes over previous version:
 * ✅ countryCode added to coupon query → compound index fully utilized
 * ✅ $or on expiryDate removed → trust status + cron job (index-safe)
 * ✅ Geo-aware similar stores (same country or global)
 * ✅ tracking fields excluded from public response
 * ✅ Field projections moved outside handler (no re-allocation per request)
 * ✅ countryFilter helper centralizes geo logic
 * ✅ Added Next.js tag-based caching via unstable_cache
 */

import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { connectDB } from "@/app/lib/mongodb";
import Store from "@/app/models/store";
import Coupon from "@/app/models/coupon";
import "@/app/models/category";

// ─── Constants ────────────────────────────────────────────────────────────────

const SIMILAR_STORES_LIMIT = 4;

// ─── Field Projections ────────────────────────────────────────────────────────
// Defined at module level — avoids string re-creation on every request.

const STORE_SELECT = [
  "name",
  "slug",
  "officialUrl",
  "countryCode", // Required: used to geo-filter coupons & similar stores
  "primaryCategoryId", // Required: used for similar stores query
  "isFeatured",
  "content",

  "policy",
  "facts",
  "images",
  "seo",
  "faqs",
  // "tracking" intentionally excluded — affiliate links are server-side only
].join(" ");

const COUPON_SELECT = [
  "title",
  "subtitle",
  "terms",
  "trackingLink",
  "type",
  "codeType",
  "code",
  "discountType",
  "discountValue",
  "maxDiscountCap",
  "minOrderValue",
  "expiryDate",
  "isVerified",
  "verifiedAt",
  "isExclusive",
  "isPinned",
  "sortOrder",
].join(" ");

const SIMILAR_STORES_SELECT = [
  "name",
  "slug",
  "images.logo",
  "isFeatured",
  "content.shortDescription",
].join(" ");

// ─── Utility Helpers ──────────────────────────────────────────────────────────

function jsonError(message, status = 500) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function normalizeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isValidSlug(slug) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

/**
 * Builds the countryCode filter for geo-aware queries.
 *
 * Rules:
 * - Store is GLOBAL → no restriction, fetch all coupons/stores
 * - Store has a country (e.g. "PK") → fetch only PK + GLOBAL coupons/stores
 *
 * This matches the compound index: { storeId, status, countryCode, ... }
 */
function buildCountryFilter(countryCode) {
  if (!countryCode || countryCode === "GLOBAL") return {};
  return { countryCode: { $in: [countryCode, "GLOBAL"] } };
}

// ─── Cached DB Fetcher ────────────────────────────────────────────────────────

/**
 * Wraps the database logic in Next.js unstable_cache.
 * This applies tag-based caching to Mongoose queries.
 */
const getCachedStoreData = (slug) =>
  unstable_cache(
    async () => {
      await connectDB();

      // 1. Fetch Store
      const store = await Store.findOne({ slug, isActive: true })
        .populate("primaryCategoryId", "name slug")
        .select(STORE_SELECT)
        .lean();

      if (!store) {
        return null; // Return null to handle 404 in the main handler
      }

      // 2. Build Parallel Queries
      const countryFilter = buildCountryFilter(store.countryCode);

      const couponQuery = {
        storeId: store._id,
        status: "active",
        ...countryFilter,
      };

      const similarStoresQuery = {
        primaryCategoryId: store.primaryCategoryId?._id,
        _id: { $ne: store._id },
        isActive: true,
        ...buildCountryFilter(store.countryCode),
      };

      // 3. Execute Both Queries in Parallel
      const [coupons, similarStores] = await Promise.all([
        Coupon.find(couponQuery)
          .select(COUPON_SELECT)
          .sort(Coupon.defaultSort()) // { isPinned: -1, sortOrder: 1, createdAt: -1 }
          .lean(),

        Store.find(similarStoresQuery)
          .select(SIMILAR_STORES_SELECT)
          .sort({ isFeatured: -1, createdAt: -1 })
          .limit(SIMILAR_STORES_LIMIT)
          .lean(),
      ]);

      return { store, coupons, similarStores };
    },
    [`store-public-api-${slug}`], // Unique cache key
    {
      tags: ["stores", `store-${slug}`], // Tag-based caching applied here
      revalidate: 300, // Optional: Automatically revalidates every 5 mins even without manual trigger
    }
  )(); // Invoke immediately

// ─── GET Handler ──────────────────────────────────────────────────────────────

export async function GET(req, { params }) {
  try {
    // ── 1. Validate Slug ──────────────────────────────────────────────────────

    const resolvedParams = await params;
    const slug = normalizeSlug(resolvedParams.slug);

    if (!slug) return jsonError("Store slug is required.", 400);
    if (!isValidSlug(slug)) return jsonError("Invalid store slug format.", 400);

    // ── 2. Fetch Cached Data ──────────────────────────────────────────────────

    const data = await getCachedStoreData(slug);

    if (!data) {
      return jsonError("Store not found or is currently inactive.", 404);
    }

    // ── 3. Respond ────────────────────────────────────────────────────────────

    return NextResponse.json(
      {
        success: true,
        data: {
          store: data.store,
          coupons: {
            total: data.coupons.length,
            items: data.coupons,
          },
          similarStores: data.similarStores,
        },
      },
      {
        status: 200,
        headers: {
          // CDN: fresh for 5 min, serve stale while revalidating for 10 min
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error(`GET /api/public/stores/[slug] Error:`, error);
    return jsonError(
      "A server error occurred while fetching store details.",
      500
    );
  }
}