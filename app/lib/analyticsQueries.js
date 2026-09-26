/**
 * Shared analytics helpers used by:
 *   /api/admin/analytics
 *   /api/admin/analytics/overview
 *   /api/admin/analytics/top-performing
 */

import AnalyticsEvent, {
  ANALYTICS_EVENT_TYPES,
} from "@/app/models/analyticsEvent";
// Importing the models registers them with Mongoose (needed for populate) and
// gives us the real collection names for $lookup.
import Coupon from "@/app/models/coupon";
import Blog from "@/app/models/blog";
import Store from "@/app/models/store";
import AmazonDeal from "@/app/models/amazonDeal";
import AffiliateProduct from "@/app/models/affiliateProduct";

export {
  AnalyticsEvent,
  ANALYTICS_EVENT_TYPES,
  Coupon,
  Blog,
  Store,
  AmazonDeal,
  AffiliateProduct,
};

// ─── Config ──────────────────────────────────────────────────────────────────

// Must match the TTL in analyticsEvent.js (older data no longer exists).
export const RETENTION_DAYS = 90;

// Day buckets in charts follow this timezone (not UTC).
export const ANALYTICS_TZ = process.env.ANALYTICS_TIMEZONE || "Asia/Karachi";

// KPI definitions. Edit here, every endpoint follows.
// NOTE: if one user action fires two of these (e.g. product_click AND
// outbound_redirect) it will be counted twice. Fire only one per click-out.
export const CONVERSION_TYPES = [
  "outbound_redirect",
  "amazon_deal_click",
  "product_click",
  "embed_click",
];
export const VIEW_TYPES = ["coupon_view", "blog_view", "store_visit"];
// Real page landings (used for traffic-source attribution).
export const LANDING_TYPES = ["blog_view", "store_visit"];

// ─── Query-param helpers ─────────────────────────────────────────────────────

/** ?range=7d|30d|90d  or  ?days=45  ->  1..90 */
export function parseDays(searchParams, fallback = 30) {
  const raw = parseInt(
    searchParams.get("range") ?? searchParams.get("days") ?? "",
    10,
  );
  const n = Number.isFinite(raw) ? raw : fallback;
  return Math.min(Math.max(n, 1), RETENTION_DAYS);
}

export function parseLimit(searchParams, fallback = 5, max = 50) {
  const raw = parseInt(searchParams.get("limit") ?? "", 10);
  const n = Number.isFinite(raw) ? raw : fallback;
  return Math.min(Math.max(n, 1), max);
}

export const daysAgo = (days, from = Date.now()) =>
  new Date(from - days * 24 * 60 * 60 * 1000);

/** "YYYY-MM-DD" of a date in the analytics timezone. */
export function dayKey(date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ANALYTICS_TZ }).format(
    date,
  );
}

/** Every day key in the window (zero-fill for charts). */
export function buildDayKeys(days, now = Date.now()) {
  const keys = new Set();
  for (let i = days; i >= 0; i--) keys.add(dayKey(new Date(now - i * 864e5)));
  return [...keys];
}

// ─── Top-performing lists ────────────────────────────────────────────────────

// $lookup with a projection so we never pull big docs (blog content = 200KB).
const lookupOne = (Model, project) => ({
  $lookup: {
    from: Model.collection.name,
    let: { id: "$_id" },
    pipeline: [
      { $match: { $expr: { $eq: ["$_id", "$$id"] } } },
      { $project: project },
    ],
    as: "doc",
  },
});

// Adds `storeName` / `storeSlug` for entities that carry a `storeId`
// (coupons, products, deals). Used by topBy({ withStore: true }).
const storeLookupStages = () => [
  {
    $lookup: {
      from: Store.collection.name,
      let: { sid: "$doc.storeId" },
      pipeline: [
        { $match: { $expr: { $eq: ["$_id", "$$sid"] } } },
        { $project: { name: 1, slug: 1 } },
      ],
      as: "store",
    },
  },
  { $addFields: { store: { $arrayElemAt: ["$store", 0] } } },
];

function topBy({
  eventType, // one type ("coupon_click") or several (["coupon_click", "product_click"])
  field,
  Model,
  project,
  shape,
  startDate,
  limit,
  withStore = false,
}) {
  return AnalyticsEvent.aggregate([
    {
      $match: {
        eventType: Array.isArray(eventType) ? { $in: eventType } : eventType,
        createdAt: { $gte: startDate },
        [field]: { $exists: true },
      },
    },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    lookupOne(Model, project),
    { $unwind: "$doc" }, // entities deleted since the event are dropped
    ...(withStore ? storeLookupStages() : []),
    {
      $project: {
        _id: 1,
        count: 1,
        ...shape,
        ...(withStore
          ? { storeName: "$store.name", storeSlug: "$store.slug" }
          : {}),
      },
    },
  ]);
}

function topEmbeds({ startDate, limit }) {
  return AnalyticsEvent.aggregate([
    {
      $match: {
        eventType: "embed_click",
        createdAt: { $gte: startDate },
        blockId: { $exists: true },
      },
    },
    {
      $group: {
        _id: { blogId: "$blogId", blockId: "$blockId" },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: Blog.collection.name,
        let: { id: "$_id.blogId" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$id"] } } },
          { $project: { title: 1, slug: 1, embeddedBlocks: 1 } },
        ],
        as: "blog",
      },
    },
    { $unwind: "$blog" },
    {
      $addFields: {
        block: {
          $arrayElemAt: [
            {
              $filter: {
                input: { $ifNull: ["$blog.embeddedBlocks", []] },
                as: "b",
                cond: { $eq: ["$$b._id", "$_id.blockId"] },
              },
            },
            0,
          ],
        },
      },
    },
    {
      $project: {
        _id: 0,
        blogId: "$_id.blogId",
        blockId: "$_id.blockId",
        count: 1,
        blogTitle: "$blog.title",
        blogSlug: "$blog.slug",
        blockTitle: { $ifNull: ["$block.title", "$block.placementToken"] },
        blockType: "$block.blockType",
      },
    },
  ]);
}

/**
 * Top entities inside [startDate, now]. Every list is `{ _id, count, ...fields }`
 * (embeds: `{ blogId, blockId, count, ... }`).
 */
export async function getTopPerforming({ startDate, limit = 5 }) {
  const args = { startDate, limit };
  const [coupons, products, deals, stores, storeClicks, blogs, embeds] =
    await Promise.all([
    topBy({
      ...args,
      withStore: true, // which store does each clicked coupon belong to?
      eventType: "coupon_click",
      field: "couponId",
      Model: Coupon,
      project: {
        title: 1,
        code: 1,
        type: 1,
        discountType: 1,
        discountValue: 1,
        storeId: 1,
      },
      shape: {
        title: "$doc.title",
        code: "$doc.code",
        type: "$doc.type",
        discountType: "$doc.discountType",
        discountValue: "$doc.discountValue",
        storeId: "$doc.storeId",
      },
    }),
    topBy({
      ...args,
      withStore: true,
      eventType: "product_click",
      field: "productId",
      Model: AffiliateProduct,
      project: { title: 1, slug: 1, brandName: 1, storeId: 1 },
      shape: {
        title: "$doc.title",
        slug: "$doc.slug",
        brandName: "$doc.brandName",
      },
    }),
    topBy({
      ...args,
      withStore: true, // stays empty if AmazonDeal has no storeId field
      eventType: "amazon_deal_click",
      field: "amazonDealId",
      Model: AmazonDeal,
      project: { title: 1, name: 1, slug: 1, storeId: 1 },
      shape: {
        title: { $ifNull: ["$doc.title", "$doc.name"] },
        slug: "$doc.slug",
      },
    }),
    topBy({
      ...args,
      eventType: "store_visit",
      field: "storeId",
      Model: Store,
      project: { name: 1, slug: 1, "images.logo.url": 1 },
      shape: {
        name: "$doc.name",
        slug: "$doc.slug",
        logo: "$doc.images.logo.url",
      },
    }),
    // Stores ranked by CLICKS (coupon + product + deal), not by page visits.
    topBy({
      ...args,
      eventType: ["coupon_click", "product_click", "amazon_deal_click"],
      field: "storeId",
      Model: Store,
      project: { name: 1, slug: 1 },
      shape: { name: "$doc.name", slug: "$doc.slug" },
    }),
    topBy({
      ...args,
      eventType: "blog_view",
      field: "blogId",
      Model: Blog,
      project: { title: 1, slug: 1 },
      shape: { title: "$doc.title", slug: "$doc.slug" },
    }),
    topEmbeds(args),
  ]);

  return { coupons, products, deals, stores, storeClicks, blogs, embeds };
}