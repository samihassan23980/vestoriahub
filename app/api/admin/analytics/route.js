import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import AnalyticsEvent from "@/app/models/analyticsEvent";
// Import related models so Mongoose can populate references
import Coupon from "@/app/models/coupon";
import Blog from "@/app/models/blog";
import Store from "@/app/models/store";
import AffiliateProduct from "@/app/models/affiliateProduct";

export const dynamic = "force-dynamic";

function jsonResponse(data, status = 200) {
  return NextResponse.json(data, { status });
}

// Helper to map country codes to readable names
const COUNTRY_MAP = {
  US: "United States",
  GB: "United Kingdom",
  UK: "United Kingdom",
  PK: "Pakistan",
  IN: "India",
  CA: "Canada",
  AU: "Australia",
  AE: "United Arab Emirates",
  GLOBAL: "Unknown / Global",
};

// Helper to calculate percentage growth safely
function calcTrend(current, previous) {
  if (previous === 0) return current > 0 ? "+100%" : "0%";
  const percent = ((current - previous) / previous) * 100;
  return `${percent > 0 ? "+" : ""}${percent.toFixed(1)}%`;
}

export async function GET(req) {
  try {
    await connectDB();

    // 1. Date Range Setup (Current vs Previous Period for Trend Math)
    const days = 30;
    const now = new Date();

    const startCurrent = new Date(now);
    startCurrent.setDate(startCurrent.getDate() - days);

    const startPrevious = new Date(startCurrent);
    startPrevious.setDate(startPrevious.getDate() - days);

    // Matchers
    const currentMatch = { createdAt: { $gte: startCurrent } };
    const previousMatch = {
      createdAt: { $gte: startPrevious, $lt: startCurrent },
    };

    // 2. Fire Advanced Aggregations Concurrently
    const [
      // Base Totals
      currentEventsCount,
      previousEventsCount,

      // Event Breakdowns
      currentEventBreakdown,
      previousEventBreakdown,

      // Time-Series (Daily grouping for charts)
      timeSeriesRaw,

      // Breakdowns
      deviceBreakdownRaw,
      referrerBreakdownRaw,
      geoBreakdownRaw,

      // Top Performing Assets (Coupons)
      topCouponsRaw,

      // Recent Activity Log
      recentEventsRaw,
    ] = await Promise.all([
      // Totals
      AnalyticsEvent.countDocuments(currentMatch),
      AnalyticsEvent.countDocuments(previousMatch),

      // Event Type Breakdowns (Current & Prev)
      AnalyticsEvent.aggregate([
        { $match: currentMatch },
        { $group: { _id: "$eventType", count: { $sum: 1 } } },
      ]),
      AnalyticsEvent.aggregate([
        { $match: previousMatch },
        { $group: { _id: "$eventType", count: { $sum: 1 } } },
      ]),

      // Time-Series: Group by Date (YYYY-MM-DD) and EventType
      AnalyticsEvent.aggregate([
        { $match: currentMatch },
        {
          $group: {
            _id: {
              date: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              type: "$eventType",
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.date": 1 } },
      ]),

      // Full Device Breakdown
      AnalyticsEvent.aggregate([
        { $match: currentMatch },
        { $group: { _id: "$deviceType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Top 10 Referrers (Excluding empty/direct)
      AnalyticsEvent.aggregate([
        { $match: { ...currentMatch, referrer: { $ne: "", $exists: true } } },
        { $group: { _id: "$referrer", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Top Geo Breakdown
      AnalyticsEvent.aggregate([
        { $match: currentMatch },
        { $group: { _id: "$countryCode", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),

      // Advanced: Top Performing Coupons (Join with Coupon collection)
      AnalyticsEvent.aggregate([
        { $match: { ...currentMatch, eventType: "coupon_click" } },
        { $group: { _id: "$couponId", clicks: { $sum: 1 } } },
        { $sort: { clicks: -1 } },
        { $limit: 5 },
        // Lookup coupon details
        {
          $lookup: {
            from: "coupons",
            localField: "_id",
            foreignField: "_id",
            as: "couponDetails",
          },
        },
        { $unwind: "$couponDetails" },
        {
          $project: {
            clicks: 1,
            title: "$couponDetails.title",
            discountValue: "$couponDetails.discountValue",
            discountType: "$couponDetails.discountType",
          },
        },
      ]),

      // Recent Log
      AnalyticsEvent.find(currentMatch)
        .sort({ createdAt: -1 })
        .limit(15)
        .populate("couponId", "title")
        .populate("blogId", "title")
        .populate("storeId", "name")
        .lean(),
    ]);

    // --- 3. DATA TRANSFORMATION & MATH ---

    // A. Parse Event Breakdowns into Maps for easy lookup
    const currMap = currentEventBreakdown.reduce(
      (acc, curr) => ({ ...acc, [curr._id]: curr.count }),
      {},
    );
    const prevMap = previousEventBreakdown.reduce(
      (acc, curr) => ({ ...acc, [curr._id]: curr.count }),
      {},
    );

    // Metrics Math
    const currentRedirects = currMap["outbound_redirect"] || 0;
    const prevRedirects = prevMap["outbound_redirect"] || 0;

    const currentViews =
      (currMap["coupon_view"] || 0) + (currMap["blog_view"] || 0);
    const prevViews =
      (prevMap["coupon_view"] || 0) + (prevMap["blog_view"] || 0);

    // B. Format Event Breakdown Array with Colors
    const EVENT_COLORS = {
      coupon_click: "bg-[#FF6B35]",
      coupon_view: "bg-[#F4A836]",
      outbound_redirect: "bg-[#22B07D]",
      blog_view: "bg-[#2D2380]",
      amazon_deal_click: "bg-[#4A3DBF]",
      store_visit: "bg-[#7775A0]",
    };

    const formattedEventBreakdown = currentEventBreakdown
      .map((evt) => ({
        label: evt._id,
        count: evt.count,
        percentage:
          currentEventsCount > 0
            ? Math.round((evt.count / currentEventsCount) * 100)
            : 0,
        color: EVENT_COLORS[evt._id] || "bg-[#7775A0]",
      }))
      .sort((a, b) => b.count - a.count);

    // C. Format Time Series for Line Charts
    // Transforms from grouped Mongo IDs to a clean array: [{ date: "2026-05-01", coupon_click: 45, blog_view: 12 }]
    const timeSeriesMap = {};
    timeSeriesRaw.forEach((item) => {
      const date = item._id.date;
      if (!timeSeriesMap[date]) timeSeriesMap[date] = { date };
      timeSeriesMap[date][item._id.type] = item.count;
    });
    const timeSeries = Object.values(timeSeriesMap).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    // D. Format Geo Data
    const geoData = geoBreakdownRaw.map((geo) => {
      const code = geo._id || "GLOBAL";
      return {
        country: code,
        name: COUNTRY_MAP[code] || code,
        clicks:
          geo.count > 999
            ? `${(geo.count / 1000).toFixed(1)}K`
            : geo.count.toString(),
        percentage:
          currentEventsCount > 0
            ? Math.round((geo.count / currentEventsCount) * 100)
            : 0,
      };
    });

    // E. Format Top Referrers & Devices
    const topReferrer = referrerBreakdownRaw[0];
    const topDevice = deviceBreakdownRaw[0];

    // F. Format Recent Events
    const recentEvents = recentEventsRaw.map((evt) => {
      let targetName = "Unknown Target";
      if (evt.couponId) targetName = evt.couponId.title;
      else if (evt.blogId) targetName = evt.blogId.title;
      else if (evt.storeId) targetName = evt.storeId.name;

      return {
        id: evt._id.toString(),
        type: evt.eventType,
        target: targetName,
        country: evt.countryCode || "GLOBAL",
        device: evt.deviceType || "unknown",
        referrer: evt.referrer || "Direct",
        time: evt.createdAt,
      };
    });

    // --- 4. ASSEMBLE FINAL PAYLOAD ---
    const payload = {
      success: true,
      data: {
        kpis: {
          conversions: {
            value: currentRedirects.toLocaleString(),
            trend: calcTrend(currentRedirects, prevRedirects), // e.g. "+8.4%"
          },
          views: {
            value: currentViews.toLocaleString(),
            trend: calcTrend(currentViews, prevViews),
          },
          topSource: {
            value: topReferrer ? topReferrer._id : "Direct/None",
            trend: topReferrer
              ? `${Math.round((topReferrer.count / currentEventsCount) * 100)}% of traffic`
              : "N/A",
          },
          topDevice: {
            value: topDevice
              ? topDevice._id.charAt(0).toUpperCase() + topDevice._id.slice(1)
              : "Unknown",
            trend: topDevice
              ? `${Math.round((topDevice.count / currentEventsCount) * 100)}% of users`
              : "N/A",
          },
        },
        timeSeries, // Ready for Recharts or Chart.js
        eventBreakdown: formattedEventBreakdown,
        deviceBreakdown: deviceBreakdownRaw.map((d) => ({
          device: d._id,
          count: d.count,
        })),
        topReferrers: referrerBreakdownRaw.map((r) => ({
          domain: r._id,
          count: r.count,
        })),
        topCoupons: topCouponsRaw, // Show exactly what's making money
        geoData,
        recentEvents,
      },
    };

    return jsonResponse(payload, 200);
  } catch (error) {
    console.error("GET /api/admin/analytics error:", error);
    return jsonResponse(
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
