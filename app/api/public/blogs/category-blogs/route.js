import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import Blog from "@/app/models/blog";
import "@/app/models/category";

// Treat as dynamic, but cache at the edge
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    // 1. Fetch the latest ~60 published blogs (enough to fill the layout)
    // Using strict projection to keep the DB query blazing fast
    const selectFields =
      "title slug excerpt featuredImage publishedAt readTimeMinutes category";
    const blogs = await Blog.find({
      status: "published",
      publishedAt: { $lte: new Date() },
    })
      .populate("category", "name slug")
      .select(selectFields)
      .sort({ publishedAt: -1 })
      .limit(60)
      .lean();

    if (!blogs || blogs.length === 0) {
      return NextResponse.json({ error: "No blogs found" }, { status: 404 });
    }

    // 2. Format the data to exactly what the UI needs
    const formattedBlogs = blogs.map((blog) => ({
      id: blog._id,
      slug: blog.slug,
      title: blog.title,
      excerpt:
        blog.excerpt ||
        "Discover the full story by reading this comprehensive article on our platform.",
      image: blog.featuredImage?.url || "",
      categoryName: blog.category?.name || "General",
      date: new Date(blog.publishedAt || blog.createdAt).toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
          year: "numeric",
        },
      ),
      readTime: `${blog.readTimeMinutes || 4} min`,
    }));

    // Fallback safety if the DB has very few blogs for testing
    const safeBlogs =
      formattedBlogs.length < 20
        ? [...formattedBlogs, ...formattedBlogs, ...formattedBlogs]
        : formattedBlogs;

    // 3. Group and Distribute Data for the UI Layout
    const remainingBlogs = safeBlogs.slice(13);
    const catMap = {};

    remainingBlogs.forEach((blog) => {
      if (!catMap[blog.categoryName]) catMap[blog.categoryName] = [];
      catMap[blog.categoryName].push(blog);
    });

    const validCategories = Object.entries(catMap)
      .filter(([_, posts]) => posts.length >= 3)
      .map(([name, posts]) => ({ name, posts: posts.slice(0, 3) }));

    const layoutPayload = {
      heroFeatured: safeBlogs[0] || null,
      heroGrid: safeBlogs.slice(1, 5),
      editorsPicks: safeBlogs.slice(5, 8),
      trending: safeBlogs.slice(8, 13),
      sidebarCategory: validCategories.pop() || null,
      feedCategories: validCategories.slice(0, 4),
    };

    return NextResponse.json(layoutPayload, {
      status: 200,
      headers: {
        // Cache on Vercel/CDN for 1 hour, serve stale while revalidating
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("GET /api/public/blogs/category-blogs Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch category blogs layout." },
      { status: 500 },
    );
  }
}
