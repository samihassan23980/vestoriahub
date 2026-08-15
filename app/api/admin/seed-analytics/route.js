// app/api/seed-analytics/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import AnalyticsEvent from "@/app/models/analyticsEvent";
import Blog from "@/app/models/blog";

export async function GET() {
  await connectDB();

  // Get an existing blog
  const blog = await Blog.findOne();
  if (!blog) return NextResponse.json({ error: "Create a blog first" });

  const dummyEvents = [];
  const eventTypes = [
    "blog_view",
    "coupon_click",
    "outbound_redirect",
    "store_visit",
  ];

  // Generate 50 random events over the last 30 days
  for (let i = 0; i < 50; i++) {
    const randomDaysAgo = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - randomDaysAgo);

    dummyEvents.push({
      eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      blogId: blog._id, // Attach randomly to your existing models
      deviceType: ["mobile", "desktop", "tablet"][
        Math.floor(Math.random() * 3)
      ],
      countryCode: ["US", "PK", "IN", "GB"][Math.floor(Math.random() * 4)],
      referrer: "google.com",
      createdAt: date,
    });
  }

  await AnalyticsEvent.insertMany(dummyEvents);

  return NextResponse.json({
    success: true,
    message: "50 Dummy events added! Check your dashboard now.",
  });
}
