/**
 * GET /api/admin/analytics/top-performing?range=30d&limit=5
 * Add admin auth (see main analytics route).
 *
 * Existing keys (coupons, blogs, stores) keep their old shape.
 * New keys: products, deals, embeds.
 */

import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import {
  parseDays,
  parseLimit,
  daysAgo,
  getTopPerforming,
} from "@/app/lib/analyticsQueries";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const days = parseDays(searchParams, 30);
    const limit = parseLimit(searchParams, 5);

    const top = await getTopPerforming({ startDate: daysAgo(days), limit });

    return NextResponse.json(
      {
        timeframe: `Last ${days} days`,
        topPerforming: {
          coupons: top.coupons.map((c) => ({
            coupon: {
              _id: c._id,
              title: c.title,
              code: c.code,
              type: c.type,
              discountType: c.discountType,
              discountValue: c.discountValue,
            },
            store: c.storeName || null,
            clicks: c.count,
          })),
          blogs: top.blogs.map((b) => ({
            blog: { _id: b._id, title: b.title, slug: b.slug },
            views: b.count,
          })),
          stores: top.stores.map((s) => ({
            store: {
              _id: s._id,
              name: s.name,
              slug: s.slug,
              images: { logo: { url: s.logo || "" } },
            },
            visits: s.count,
          })),
          products: top.products.map((p) => ({
            product: {
              _id: p._id,
              title: p.title,
              slug: p.slug,
              brandName: p.brandName,
            },
            store: p.storeName || null,
            clicks: p.count,
          })),
          deals: top.deals.map((d) => ({
            deal: { _id: d._id, title: d.title, slug: d.slug },
            store: d.storeName || null,
            clicks: d.count,
          })),
          storeClicks: top.storeClicks.map((s) => ({
            store: { _id: s._id, name: s.name, slug: s.slug },
            clicks: s.count,
          })),
          embeds: top.embeds.map((e) => ({
            blogId: e.blogId,
            blockId: e.blockId,
            blogTitle: e.blogTitle,
            blockTitle: e.blockTitle,
            blockType: e.blockType,
            clicks: e.count,
          })),
        },
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("GET /admin/analytics/top-performing Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch top performing entities." },
      { status: 500 },
    );
  }
}