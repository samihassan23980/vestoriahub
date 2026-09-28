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

/** ?limit=10 -> 1..max (default max 50). Controls how deep each "Top ..." list goes. */
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

// ─── Calendar-day windows (Today / Yesterday) ────────────────────────────────

// Minutes to ADD to a UTC instant to get the wall-clock time in `timeZone`.
function tzOffsetMinutes(date, timeZone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  const asUTC = Date.UTC(
    +parts.year,
    +parts.month - 1,
    +parts.day,
    +parts.hour,
    +parts.minute,
    +parts.second,
  );
  return Math.round((asUTC - date.getTime()) / 60000);
}

/** Local midnight (ANALYTICS_TZ), `offsetDays` days before `from`. offsetDays=0 -> today. */
export function startOfLocalDay(offsetDays = 0, from = Date.now()) {
  const [y, m, d] = dayKey(new Date(from - offsetDays * 864e5))
    .split("-")
    .map(Number);
  // Sample the UTC offset at local noon so a midnight DST edge can't shift the date.
  const offset = tzOffsetMinutes(new Date(Date.UTC(y, m - 1, d, 12)), ANALYTICS_TZ);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - offset * 60000);
}

/** Every "HH:00" label for one local day (zero-fill for the hourly chart). */
export function buildHourKeys() {
  return Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00`);
}

/**
 * Normalizes `?range=` into a window object both admin routes share.
 *   - "today" / "yesterday"  -> an EXACT calendar day (ANALYTICS_TZ), hourly
 *     granularity, compared against the day right before it.
 *   - "7d" / "30d" / "90d" / ?days=N -> a rolling N-day window (unchanged
 *     behaviour), compared against the previous N days.
 */
export function parseRange(searchParams, fallbackDays = 30) {
  const raw = (searchParams.get("range") || "").toLowerCase();

  if (raw === "today" || raw === "yesterday") {
    const offset = raw === "today" ? 0 : 1;
    const startCurrent = startOfLocalDay(offset);
    const endCurrent = startOfLocalDay(offset - 1); // next local midnight (exclusive)
    const startPrevious = startOfLocalDay(offset + 1);
    return {
      mode: "day",
      label: raw === "today" ? "Today" : "Yesterday",
      compareLabel: raw === "today" ? "vs yesterday" : "vs day before",
      granularity: "hour",
      days: 1,
      startCurrent,
      endCurrent,
      startPrevious,
      endPrevious: startCurrent,
      hasPrevious: true, // one day back is always inside the 90-day retention
    };
  }

  const days = parseDays(searchParams, fallbackDays);
  return {
    mode: "range",
    label: `Last ${days} days`,
    compareLabel: `vs previous ${days} days`,
    granularity: "day",
    days,
    startCurrent: daysAgo(days),
    endCurrent: new Date(),
    startPrevious: daysAgo(days * 2),
    endPrevious: daysAgo(days),
    hasPrevious: days * 2 <= RETENTION_DAYS,
  };
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
  endDate, // optional, exclusive upper bound — needed for "yesterday" (must not leak today)
  limit,
  withStore = false,
}) {
  return AnalyticsEvent.aggregate([
    {
      $match: {
        eventType: Array.isArray(eventType) ? { $in: eventType } : eventType,
        createdAt: endDate ? { $gte: startDate, $lt: endDate } : { $gte: startDate },
        [field]: { $exists: true },
      },
    },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    // `_id: 1` tiebreaker keeps the order stable when several entities land
    // on the exact same count (common once a site has real traffic).
    { $sort: { count: -1, _id: 1 } },
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

function topEmbeds({ startDate, endDate, limit }) {
  return AnalyticsEvent.aggregate([
    {
      $match: {
        eventType: "embed_click",
        createdAt: endDate ? { $gte: startDate, $lt: endDate } : { $gte: startDate },
        blockId: { $exists: true },
      },
    },
    {
      $group: {
        _id: { blogId: "$blogId", blockId: "$blockId" },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1, "_id.blogId": 1, "_id.blockId": 1 } },
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
 * Top entities inside [startDate, endDate). Every list is `{ _id, count, ...fields }`
 * (embeds: `{ blogId, blockId, count, ... }`). `endDate` is optional — leave it
 * out for an open-ended "since startDate" window (used by the rolling ranges).
 */
export async function getTopPerforming({ startDate, endDate, limit = 5 }) {
  const args = { startDate, endDate, limit };
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