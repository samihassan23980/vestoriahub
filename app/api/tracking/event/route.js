import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import AnalyticsEvent from "@/app/models/analyticsEvent";
import Blog from "@/app/models/blog";

// Simple UA parser fallback for device type detection
function getDeviceType(userAgent) {
  if (!userAgent) return "unknown";
  const ua = userAgent.toLowerCase();

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "tablet";
  }
  if (
    /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      ua,
    )
  ) {
    return "mobile";
  }
  return "desktop";
}

export async function POST(req) {
  try {
    // We don't await DB connection before parsing request to save time
    const body = await req.json();

    // 1. Extract context from headers
    // Support for Vercel (x-vercel-ip-country) and Cloudflare (cf-ipcountry) headers
    const countryCodeHeader =
      req.headers.get("x-vercel-ip-country") ||
      req.headers.get("cf-ipcountry") ||
      "GLOBAL";
    const countryCode = countryCodeHeader.toUpperCase().substring(0, 10);

    const rawUa = req.headers.get("user-agent") || "";
    const ua = rawUa.substring(0, 300); // Schema maxlength limit
    const deviceType = getDeviceType(rawUa);

    // Use header referer if not explicitly sent in body payload
    const rawReferrer = body.referrer || req.headers.get("referer") || "";
    const referrer = rawReferrer.substring(0, 500); // Schema maxlength limit

    // 2. Build the event document
    const eventPayload = {
      eventType: body.eventType,
      sid: body.sid || "anonymous", // Frontend should ideally send a session UUID
      countryCode,
      deviceType,
      ua,
      referrer,

      // Optional Entity References
      couponId: body.couponId || null,
      amazonDealId: body.amazonDealId || null,
      blogId: body.blogId || null,
      storeId: body.storeId || null,
      categoryId: body.categoryId || null,

      createdAt: new Date(), // Manually defined for TTL index
    };

    // 3. Connect to DB and Insert Event
    await connectDB();

    // We use create() for append-only fast inserts
    await AnalyticsEvent.create(eventPayload);

    // 4. Fire-and-Forget Entity Updates (Cross-Entity Attribution)
    // IMPORTANT: We do NOT `await` this block so the API responds instantly to the frontend.
    // We use $inc to avoid race conditions.
    if (body.eventType === "blog_view" && body.blogId) {
      Blog.findByIdAndUpdate(body.blogId, { $inc: { viewCount: 1 } }).catch(
        (err) => console.error("Failed to increment blog viewCount:", err),
      );
    }

    // You can add similar fire-and-forget $inc updates for Coupons or AmazonDeals here if needed in the future.

    // 5. Fast Return (202 Accepted is standard for analytics ingestion)
    return NextResponse.json(
      { success: true, message: "Event recorded." },
      { status: 202 },
    );
  } catch (error) {
    console.error("POST /tracking/event Error:", error);
    // Don't crash the frontend if analytics fails; return a safe 200/202 or 400
    // But for debugging, we return 400 with the error.
    return NextResponse.json(
      { error: "Invalid event payload or server error." },
      { status: 400 },
    );
  }
}
