/**
 * GET /api/admin/analytics/overview?range=30d   (or ?days=N, max 90)
 * Lightweight event counters. Add admin auth (see main analytics route).
 */

import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import {
  AnalyticsEvent,
  ANALYTICS_EVENT_TYPES,
  CONVERSION_TYPES,
  parseDays,
  daysAgo,
} from "@/app/lib/analyticsQueries";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const days = parseDays(searchParams, 30);
    const startDate = daysAgo(days);

    const results = await AnalyticsEvent.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: "$eventType", count: { $sum: 1 } } },
    ]);

    // coupon_view -> coupon_views, outbound_redirect -> outbound_redirects ...
    // Every event type is listed (0 by default), so new types show up automatically.
    const stats = Object.fromEntries(
      ANALYTICS_EVENT_TYPES.map((t) => [`${t}s`, 0]),
    );
    for (const item of results) {
      if (`${item._id}s` in stats) stats[`${item._id}s`] = item.count;
    }

    const byType = Object.fromEntries(results.map((r) => [r._id, r.count]));
    const totalInteractions = results.reduce((sum, r) => sum + r.count, 0);
    const totalClicks =
      stats.coupon_clicks +
      stats.amazon_deal_clicks +
      stats.product_clicks +
      stats.embed_clicks;
    const totalConversions = CONVERSION_TYPES.reduce(
      (sum, t) => sum + (byType[t] || 0),
      0,
    );

    return NextResponse.json(
      {
        timeframe: `Last ${days} days`,
        startDate,
        stats,
        summary: { totalInteractions, totalClicks, totalConversions },
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("GET /admin/analytics/overview Error:", error);
    return NextResponse.json(
      { error: "Failed to generate analytics overview." },
      { status: 500 },
    );
  }
}