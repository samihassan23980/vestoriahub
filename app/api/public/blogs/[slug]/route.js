import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import Blog from "@/app/models/blog";

// 1. Pre-load referenced schemas to prevent Mongoose MissingSchemaError
import "@/app/models/category";
import "@/app/models/store";
import "@/app/models/affiliateProduct"; // Change to "product" if your model is named Product

// 2. Explicit selection for performance (whitelist > blacklist)
const SELECT_FIELDS = [
  "title",
  "slug",
  "excerpt",
  "content",
  "embeddedBlocks",
  "featuredImage",
  "publishedAt",
  "updatedAt",
  "readTimeMinutes",
  "viewCount",
  "category",
  "author",
  "tags",
  "faqs",
  "relatedStores",
  "seo",
].join(" ");

export async function GET(req, { params }) {
  try {
    // Ensure DB connection
    await connectDB();

    // 3. NEXT.JS 15 FIX: `params` is now an asynchronous Promise in Next.js App Router
    const { slug: rawSlug } = await params;

    if (!rawSlug) {
      return NextResponse.json(
        { success: false, error: "Blog slug is required." },
        { status: 400 },
      );
    }

    const slug = rawSlug.trim().toLowerCase();

    // 4. Fetch the published blog with lean() for pure JS object
    const blog = await Blog.findOne({
      slug,
      status: "published",
      publishedAt: { $lte: new Date() },
    })
      .select(SELECT_FIELDS)
      .populate("category", "name slug")
      .populate("relatedStores", "name slug images.logo")
      .populate({
        path: "embeddedBlocks.productRef",
        select:
          "title price discountPercentage images affiliateLink rating reviewCount",
        model: "AffiliateProduct", // <--- ADD THIS LINE TO FIX THE ERROR
      })
      .lean();

    // 5. Handle 404 cleanly
    if (!blog) {
      return NextResponse.json(
        { success: false, error: "Blog article not found or not published." },
        { status: 404 },
      );
    }

    // 6. FIRE-AND-FORGET: Increment view count asynchronously
    // We don't await this so it doesn't block the API response
    Blog.updateOne({ _id: blog._id }, { $inc: { viewCount: 1 } }).catch((err) =>
      console.error(`View count failed for ${slug}:`, err),
    );

    // 7. DTO (Data Transfer Object) Formatting
    // Never send raw Mongoose objects directly to the frontend (_id, __v, nulls)
    const formattedBlog = {
      id: String(blog._id),
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      content: blog.content,
      readTimeMinutes: blog.readTimeMinutes,
      viewCount: (blog.viewCount || 0) + 1, // Add 1 to reflect current view
      publishedAt: blog.publishedAt,
      updatedAt: blog.updatedAt,

      featuredImage: blog.featuredImage?.url ? blog.featuredImage : null,

      category: blog.category
        ? {
            id: String(blog.category._id),
            name: blog.category.name,
            slug: blog.category.slug,
          }
        : null,

      author: {
        name: blog.author?.name || "Editorial Team",
        role: blog.author?.role || "",
        avatar: blog.author?.avatar || "",
      },

      tags: Array.isArray(blog.tags) ? blog.tags : [],
      faqs: Array.isArray(blog.faqs) ? blog.faqs : [],
      embeddedBlocks: Array.isArray(blog.embeddedBlocks)
        ? blog.embeddedBlocks
        : [],

      relatedStores: Array.isArray(blog.relatedStores)
        ? blog.relatedStores.map((store) => ({
            id: String(store._id),
            name: store.name,
            slug: store.slug,
            logo: store.images?.logo || null,
          }))
        : [],

      seo: blog.seo || {
        metaTitle: blog.title,
        metaDescription: blog.excerpt,
        canonicalUrl: null,
      },
    };

    // 8. Return successful response with caching
    return NextResponse.json(
      { success: true, data: formattedBlog },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
        },
      },
    );
  } catch (error) {
    console.error("GET /api/public/blogs/[slug] Error:", error);

    // 9. Graceful 500 error handling
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred while fetching the blog.",
      },
      { status: 500 },
    );
  }
}
