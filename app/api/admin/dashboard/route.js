import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";

// Import all relevant schemas
import Store from "@/app/models/store";
import Coupon from "@/app/models/coupon";
import Blog from "@/app/models/blog";
import AffiliateProduct from "@/app/models/affiliateProduct";
import AffiliateNetwork from "@/app/models/affiliateNetwork";
import AnalyticsEvent from "@/app/models/analyticsEvent";
import SiteSettings from "@/app/models/siteSettings";
import GeoFirewall from "@/app/models/geoFirewall";

// Force dynamic rendering because dashboard data changes constantly
export const dynamic = "force-dynamic";

/**
 * Helper to standardise JSON responses for SweetAlert2 consumption on the frontend.
 */
function jsonResponse(data, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET(req) {
  try {
    // 1. Ensure DB connection is established
    await connectDB();

    // Calculate date for 30-day analytics window
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 2. Fire ALL queries concurrently for maximum speed
    // Using Promise.all ensures we wait for the slowest query, not the sum of all queries.
    const [
      // --- COUNTERS (Extremely fast using indexes) ---
      totalStores,
      activeStores,
      totalCoupons,
      activeCoupons,
      totalBlogs,
      totalAffiliateProducts,
      activeNetworks,
      activeFirewallRules,

      // --- SYSTEM CONFIG ---
      siteSettings,

      // --- ANALYTICS (Last 30 Days Aggregation) ---
      analyticsSummary,

      // --- RECENT ACTIVITY (Lean queries for speed) ---
      recentCoupons,
      recentBlogs,
    ] = await Promise.all([
      Store.countDocuments(),
      Store.countDocuments({ isActive: true }),

      Coupon.countDocuments(),
      Coupon.countDocuments({ status: "active" }),

      Blog.countDocuments({ status: "published" }),

      AffiliateProduct.countDocuments(),

      AffiliateNetwork.countDocuments({ status: "active" }),

      GeoFirewall.countDocuments({ status: "active" }),

      // Fetch the global singleton
      SiteSettings.findOne({ singletonId: "sociantech-global" })
        .select("maintenanceMode siteName")
        .lean(),

      // Aggregate events (clicks, views) for the last 30 days
      AnalyticsEvent.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: "$eventType", count: { $sum: 1 } } },
      ]),

      // Fetch 5 most recently added active coupons
      Coupon.find({ status: "active" })
        .select("title discountType discountValue type code")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      // Fetch 5 most recently published blogs
      Blog.find({ status: "published" })
        .select("title viewCount publishedAt")
        .sort({ publishedAt: -1 })
        .limit(5)
        .lean(),
    ]);

    // 3. Format Analytics Data cleanly
    // Convert array [{_id: "coupon_click", count: 150}] to object { coupon_click: 150 }
    const formattedAnalytics = analyticsSummary.reduce(
      (acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      },
      {
        coupon_click: 0,
        coupon_view: 0,
        outbound_redirect: 0,
        amazon_deal_click: 0,
        blog_view: 0,
        store_visit: 0,
      },
    );

    // 4. Construct the final Payload
    const dashboardPayload = {
      success: true,
      data: {
        metrics: {
          stores: { total: totalStores, active: activeStores },
          coupons: { total: totalCoupons, active: activeCoupons },
          blogs: { published: totalBlogs },
          products: { total: totalAffiliateProducts },
          networks: { active: activeNetworks },
          security: { activeFirewallRules },
        },
        analytics: {
          period: "last_30_days",
          events: formattedAnalytics,
        },
        system: {
          maintenanceMode: siteSettings?.maintenanceMode || false,
          siteName: siteSettings?.siteName || "Takesmeout",
        },
        recentActivity: {
          coupons: recentCoupons,
          blogs: recentBlogs,
        },
      },
    };

    return jsonResponse(dashboardPayload, 200);
  } catch (error) {
    console.error("GET /api/admin/dashboard error:", error);

    // Highly descriptive error handling so you know EXACTLY what broke.
    return jsonResponse(
      {
        success: false,
        error: "Failed to compile dashboard data.",
        details:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal Server Error",
        actionRequired:
          "Check database connection and ensure all collections exist with proper indexes.",
      },
      500,
    );
  }
}
