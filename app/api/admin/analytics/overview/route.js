import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import AnalyticsEvent from "@/app/models/analyticsEvent";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    // Default to last 30 days if not specified
    const days = parseInt(searchParams.get("days")) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // MongoDB Aggregation to group and count events
    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$eventType",
          count: { $sum: 1 },
        },
      },
    ];

    const results = await AnalyticsEvent.aggregate(pipeline);

    // Format the results into a clean key-value object for the frontend dashboard
    const formattedStats = {
      coupon_views: 0,
      coupon_clicks: 0,
      outbound_redirects: 0,
      amazon_deal_clicks: 0,
      blog_views: 0,
      store_visits: 0,
    };

    results.forEach((item) => {
      if (formattedStats.hasOwnProperty(item._id)) {
        formattedStats[item._id] = item.count;
      }
    });

    // Calculate some high-level metrics
    const totalInteractions = results.reduce(
      (acc, curr) => acc + curr.count,
      0,
    );
    const totalClicks =
      formattedStats.coupon_clicks + formattedStats.amazon_deal_clicks;

    return NextResponse.json(
      {
        timeframe: `Last ${days} days`,
        startDate,
        stats: formattedStats,
        summary: {
          totalInteractions,
          totalClicks,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /admin/analytics/overview Error:", error);
    return NextResponse.json(
      { error: "Failed to generate analytics overview." },
      { status: 500 },
    );
  }
}
