import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/app/lib/mongodb";
import AnalyticsEvent from "@/app/models/analyticsEvent";

// Ensure related models are registered before populating
import "@/app/models/coupon";
import "@/app/models/blog";
import "@/app/models/store";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const days = parseInt(searchParams.get("days")) || 30;
    const limit = parseInt(searchParams.get("limit")) || 5; // Top 5 by default

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Helper function to build aggregation pipeline
    const buildPipeline = (eventType, groupField) => [
      {
        $match: {
          eventType: eventType,
          createdAt: { $gte: startDate },
          [groupField]: { $ne: null }, // Ensure the ID exists
        },
      },
      {
        $group: {
          _id: `$${groupField}`,
          interactions: { $sum: 1 },
        },
      },
      { $sort: { interactions: -1 } },
      { $limit: limit },
    ];

    // Run parallel aggregations for maximum performance
    const [topCouponsData, topBlogsData, topStoresData] = await Promise.all([
      AnalyticsEvent.aggregate(buildPipeline("coupon_click", "couponId")),
      AnalyticsEvent.aggregate(buildPipeline("blog_view", "blogId")),
      AnalyticsEvent.aggregate(buildPipeline("store_visit", "storeId")),
    ]);

    // Populate the actual document details using Mongoose Population on aggregated results
    const topCoupons = await mongoose.model("Coupon").populate(topCouponsData, {
      path: "_id",
      select: "title code discountValue discountType type",
    });

    const topBlogs = await mongoose.model("Blog").populate(topBlogsData, {
      path: "_id",
      select: "title slug viewCount",
    });

    const topStores = await mongoose.model("Store").populate(topStoresData, {
      path: "_id",
      select: "name slug images.logo",
    });

    // Format final payload
    return NextResponse.json(
      {
        timeframe: `Last ${days} days`,
        topPerforming: {
          coupons: topCoupons.map((c) => ({
            coupon: c._id,
            clicks: c.interactions,
          })),
          blogs: topBlogs.map((b) => ({
            blog: b._id,
            views: b.interactions,
          })),
          stores: topStores.map((s) => ({
            store: s._id,
            visits: s.interactions,
          })),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /admin/analytics/top-performing Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch top performing entities." },
      { status: 500 },
    );
  }
}
