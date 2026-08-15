import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import Blog from "@/app/models/blog";
import "@/app/models/category"; // Required for population

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 12;
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");

    // Strictly enforce published status AND ensure the publish date is not in the future
    const query = {
      status: "published",
      publishedAt: { $lte: new Date() }, // Hides scheduled posts until their time arrives
    };

    if (categoryId) query.category = categoryId;

    if (search) {
      // Searching against the optimized plain-text index
      query.$text = { $search: search };
    }

    // Determine sorting logic
    const sortLogic = search
      ? { score: { $meta: "textScore" } }
      : { publishedAt: -1 }; // Newest published first

    const blogs = await Blog.find(query)
      .populate("category", "name slug")
      // Exclude heavy fields to keep the listing API ultra-fast
      .select("-content -contentText -embeddedBlocks -faqs -relatedStores")
      .sort(sortLogic)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await Blog.countDocuments(query);

    return NextResponse.json(
      {
        blogs,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    console.error("GET /public/blogs Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch blogs." },
      { status: 500 },
    );
  }
}
