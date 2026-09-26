/**
 * GET /api/admin/analytics?range=7d|30d|90d   (or ?days=N, max 90)
 *
 * Dashboard payload. Response shape is backward compatible with the existing
 * Analytics page (kpis, eventBreakdown, geoData, recentEvents, topCoupons ...)
 * and adds: tops, uniqueVisitors, zero-filled timeSeries, meta.
 *
 * SECURITY: this endpoint exposes business data. Make sure it is protected by
 * your admin auth (middleware or a session check at the top of GET).
 */

import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import {
  AnalyticsEvent,
  ANALYTICS_EVENT_TYPES,
  ANALYTICS_TZ,
  CONVERSION_TYPES,
  VIEW_TYPES,
  LANDING_TYPES,
  RETENTION_DAYS,
  parseDays,
  parseLimit,
  daysAgo,
  buildDayKeys,
  getTopPerforming,
} from "@/app/lib/analyticsQueries";

export const dynamic = "force-dynamic";

const json = (data, status = 200) =>
  NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

// ─── Static maps ─────────────────────────────────────────────────────────────

const COUNTRY_MAP = {
  US: "United States",
  GB: "United Kingdom",
  UK: "United Kingdom",
  PK: "Pakistan",
  IN: "India",
  CA: "Canada",
  AU: "Australia",
  AE: "United Arab Emirates",
  SA: "Saudi Arabia",
  DE: "Germany",
  FR: "France",
  GLOBAL: "Unknown / Global",
};

// Tailwind classes (kept as full strings so Tailwind can see them).
const EVENT_COLORS = {
  coupon_click: "bg-[#FF6B35]",
  coupon_view: "bg-[#F4A836]",
  outbound_redirect: "bg-[#22B07D]",
  blog_view: "bg-[#2D2380]",
  amazon_deal_click: "bg-[#4A3DBF]",
  product_click: "bg-[#D6409F]",
  embed_click: "bg-[#0EA5E9]",
  store_visit: "bg-[#7775A0]",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcTrend(current, previous, hasPrevious) {
  if (!hasPrevious) return "N/A"; // previous window is older than retention
  if (previous === 0) return current > 0 ? "New" : "0%";
  const pct = ((current - previous) / previous) * 100;
  return `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`;
}

const sumTypes = (map, types) =>
  types.reduce((total, t) => total + (map[t] || 0), 0);

const pct = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

const compact = (n) => (n > 999 ? `${(n / 1000).toFixed(1)}K` : String(n));

/** Human readable target of an event (works with populated refs). */
function resolveTarget(evt) {
  const coupon = evt.couponId?.title;
  const product = evt.productId?.title;
  const deal = evt.amazonDealId?.title || evt.amazonDealId?.name;
  const blog = evt.blogId?.title;
  const store = evt.storeId?.name;

  if (evt.eventType === "embed_click") {
    const block = evt.blogId?.embeddedBlocks?.find(
      (b) => String(b._id) === String(evt.blockId),
    );
    const label = block?.title || block?.placementToken || "Embedded block";
    return blog ? `${label} · ${blog}` : label;
  }

  const order = {
    coupon_view: [coupon],
    coupon_click: [coupon],
    product_click: [product],
    amazon_deal_click: [deal],
    blog_view: [blog],
    store_visit: [store],
    outbound_redirect: [coupon, product, deal, store],
  }[evt.eventType] || [coupon, product, deal, blog, store];

  return (
    order.find(Boolean) ||
    [coupon, product, deal, blog, store].find(Boolean) ||
    "Deleted / unknown target"
  );
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function GET(req) {
  try {
    // TODO: enforce admin authentication here if not handled by middleware.
    await connectDB();

    const { searchParams } = new URL(req.url);
    const days = parseDays(searchParams, 30);
    const limit = parseLimit(searchParams, 5);

    const now = Date.now();
    const startCurrent = daysAgo(days, now);
    const startPrevious = daysAgo(days * 2, now);
    // The previous window only exists if it is inside the retention period.
    const hasPrevious = days * 2 <= RETENTION_DAYS;

    const currentMatch = { createdAt: { $gte: startCurrent } };

    // Exclude our own site from "traffic sources" (internal navigation).
    const ownHost = hostOf(process.env.NEXT_PUBLIC_SITE_URL || "");

    const [
      periodRows,
      timeSeriesRaw,
      deviceRaw,
      geoRaw,
      referrerRaw,
      visitorsRaw,
      tops,
      recentRaw,
    ] = await Promise.all([
      // One pass for both periods: { p: "c" | "p", t: eventType } -> count
      AnalyticsEvent.aggregate([
        {
          $match: {
            createdAt: { $gte: hasPrevious ? startPrevious : startCurrent },
          },
        },
        {
          $group: {
            _id: {
              p: { $cond: [{ $gte: ["$createdAt", startCurrent] }, "c", "p"] },
              t: "$eventType",
            },
            count: { $sum: 1 },
          },
        },
      ]),

      // Daily series in the analytics timezone
      AnalyticsEvent.aggregate([
        { $match: currentMatch },
        {
          $group: {
            _id: {
              date: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$createdAt",
                  timezone: ANALYTICS_TZ,
                },
              },
              type: "$eventType",
            },
            count: { $sum: 1 },
          },
        },
      ]),

      AnalyticsEvent.aggregate([
        { $match: currentMatch },
        { $group: { _id: "$deviceType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      AnalyticsEvent.aggregate([
        { $match: currentMatch },
        { $group: { _id: "$countryCode", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),

      // Traffic sources: group by referrer HOSTNAME, only real page landings.
      AnalyticsEvent.aggregate([
        {
          $match: { ...currentMatch, eventType: { $in: LANDING_TYPES } },
        },
        {
          $addFields: {
            host: {
              $let: {
                vars: {
                  m: {
                    $regexFind: {
                      input: { $ifNull: ["$referrer", ""] },
                      regex: "^https?://(?:www\\.)?([^/?#:]+)",
                    },
                  },
                },
                in: {
                  $ifNull: [
                    { $toLower: { $arrayElemAt: ["$$m.captures", 0] } },
                    "Direct",
                  ],
                },
              },
            },
          },
        },
        ...(ownHost ? [{ $match: { host: { $ne: ownHost } } }] : []),
        { $group: { _id: "$host", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Unique visitors (anonymous sessions)
      AnalyticsEvent.aggregate([
        { $match: { ...currentMatch, sid: { $exists: true } } },
        { $group: { _id: "$sid" } },
        { $count: "n" },
      ]),

      getTopPerforming({ startDate: startCurrent, limit }),

      AnalyticsEvent.find(currentMatch)
        .sort({ createdAt: -1 })
        .limit(15)
        // Coupons/products also load their own store, used as a fallback for
        // older events that were saved before storeId was filled on the server.
        .populate({
          path: "couponId",
          select: "title storeId",
          populate: { path: "storeId", select: "name" },
        })
        .populate({
          path: "productId",
          select: "title storeId",
          populate: { path: "storeId", select: "name" },
        })
        .populate("amazonDealId", "title name")
        .populate("blogId", "title embeddedBlocks")
        .populate("storeId", "name")
        .lean(),
    ]);

    // ── Period maps ───────────────────────────────────────────────────────
    const currMap = {};
    const prevMap = {};
    for (const row of periodRows) {
      (row._id.p === "c" ? currMap : prevMap)[row._id.t] = row.count;
    }
    const currentTotal = Object.values(currMap).reduce((a, b) => a + b, 0);

    // ── KPIs ──────────────────────────────────────────────────────────────
    const conversions = sumTypes(currMap, CONVERSION_TYPES);
    const prevConversions = sumTypes(prevMap, CONVERSION_TYPES);
    const views = sumTypes(currMap, VIEW_TYPES);
    const prevViews = sumTypes(prevMap, VIEW_TYPES);
    const landingTotal = sumTypes(currMap, LANDING_TYPES);

    const topExternalSource = referrerRaw.find((r) => r._id !== "Direct");
    const topDevice = deviceRaw[0];

    // ── Event breakdown ───────────────────────────────────────────────────
    const eventBreakdown = Object.entries(currMap)
      .map(([label, count]) => ({
        label,
        count,
        percentage: pct(count, currentTotal),
        color: EVENT_COLORS[label] || "bg-[#7775A0]",
      }))
      .sort((a, b) => b.count - a.count);

    // ── Time series (zero-filled, every day present) ──────────────────────
    const seriesByDate = {};
    for (const key of buildDayKeys(days, now)) {
      seriesByDate[key] = {
        date: key,
        total: 0,
        ...Object.fromEntries(ANALYTICS_EVENT_TYPES.map((t) => [t, 0])),
      };
    }
    for (const item of timeSeriesRaw) {
      const row = seriesByDate[item._id.date];
      if (!row) continue; // bucket outside the window edge
      row[item._id.type] = item.count;
      row.total += item.count;
    }
    const timeSeries = Object.values(seriesByDate).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    // ── Geo ───────────────────────────────────────────────────────────────
    const geoData = geoRaw.map((g) => {
      const code = g._id || "GLOBAL";
      return {
        country: code,
        name: COUNTRY_MAP[code] || code,
        clicks: compact(g.count), // (all events; key kept for the UI)
        count: g.count,
        percentage: pct(g.count, currentTotal),
      };
    });

    // ── Recent events ─────────────────────────────────────────────────────
    const recentEvents = recentRaw.map((evt) => ({
      id: evt._id.toString(),
      type: evt.eventType,
      target: resolveTarget(evt),
      store:
        evt.storeId?.name ||
        evt.couponId?.storeId?.name ||
        evt.productId?.storeId?.name ||
        null,
      country: evt.countryCode || "GLOBAL",
      device: evt.deviceType || "unknown",
      referrer: evt.referrer ? hostOf(evt.referrer) || evt.referrer : "Direct",
      time: evt.createdAt,
    }));

    // ── Payload ───────────────────────────────────────────────────────────
    return json({
      success: true,
      data: {
        meta: {
          days,
          from: startCurrent,
          to: new Date(now),
          timezone: ANALYTICS_TZ,
          retentionDays: RETENTION_DAYS,
          comparesToPrevious: hasPrevious,
        },
        kpis: {
          conversions: {
            value: conversions.toLocaleString(),
            trend: calcTrend(conversions, prevConversions, hasPrevious),
          },
          views: {
            value: views.toLocaleString(),
            trend: calcTrend(views, prevViews, hasPrevious),
          },
          topSource: {
            value: topExternalSource ? topExternalSource._id : "Direct/None",
            trend: topExternalSource
              ? `${pct(topExternalSource.count, landingTotal)}% of landings`
              : "N/A",
          },
          topDevice: {
            value: topDevice
              ? String(topDevice._id ?? "unknown").replace(/^./, (c) =>
                  c.toUpperCase(),
                )
              : "Unknown",
            trend: topDevice
              ? `${pct(topDevice.count, currentTotal)}% of events`
              : "N/A",
          },
        },
        uniqueVisitors: visitorsRaw[0]?.n || 0,
        timeSeries,
        eventBreakdown,
        deviceBreakdown: deviceRaw.map((d) => ({
          device: d._id ?? "unknown",
          count: d.count,
        })),
        topReferrers: referrerRaw.map((r) => ({
          domain: r._id,
          count: r.count,
        })),
        topCoupons: tops.coupons, // kept for the existing UI
        tops, // coupons, products, deals, stores, blogs, embeds
        geoData,
        recentEvents,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/analytics error:", error);
    return json(
      {
        success: false,
        error: "Failed to compile deep analytics.",
        details:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal Server Error",
      },
      500,
    );
  }
}