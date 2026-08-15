// File: app/lib/getHomeLayout.js
import { connectDB } from "@/app/lib/mongodb";
import mongoose from "mongoose";

// 🔥 Direct Named Imports (Prevents Next.js Webpack Tree-Shaking)
import CategoryModel from "@/app/models/category";
import BlogModel from "@/app/models/blog";

const SECTION_SIZES = {
  heroFeatured: 1,
  heroGrid: 4,
  editorsPicks: 6,
  trending: 8,
  deepDives: 8,
};

// Safe Model Getter helper
function getModels() {
  const Blog = mongoose.models.Blog || BlogModel;
  const Category = mongoose.models.Category || CategoryModel;

  if (!Blog || !Category) {
    throw new Error("Mongoose Blog or Category model failed to load.");
  }

  return { Blog, Category };
}

export async function getHomeLayout() {
  await connectDB();

  // 🔥 Ensures Mongoose Model Registry has Category initialized before populate
  const { Blog } = getModels();

  const selectFields =
    "title slug excerpt featuredImage publishedAt createdAt readTimeMinutes category author";

  try {
    const blogs = await Blog.find({
      status: "published",
      publishedAt: { $lte: new Date() },
    })
      .populate("category", "name slug")
      .select(selectFields)
      .sort({ publishedAt: -1 })
      .limit(80)
      .lean();

    if (!blogs || blogs.length === 0) {
      return null;
    }

    const formattedBlogs = blogs.map((blog) => ({
      id: String(blog._id),
      slug: blog.slug,
      title: blog.title,
      excerpt:
        blog.excerpt ||
        "Discover the full story by reading this comprehensive article.",
      image: blog.featuredImage?.url || "",
      categoryName: blog.category?.name || "General",
      categorySlug: blog.category?.slug || "general",
      author: blog.author || { name: "Editorial Team" },
      date: new Date(blog.publishedAt || blog.createdAt).toLocaleDateString(
        "en-US",
        { month: "short", day: "numeric", year: "numeric" },
      ),
      readTime: `${blog.readTimeMinutes || 4} min`,
    }));

    let cursor = 0;
    const take = (count) => {
      const chunk = formattedBlogs.slice(cursor, cursor + count);
      cursor += chunk.length;
      return chunk;
    };

    const heroFeaturedArr = take(SECTION_SIZES.heroFeatured);
    const heroFeatured = heroFeaturedArr[0] || null;
    const heroGrid = take(SECTION_SIZES.heroGrid);
    const editorsPicks = take(SECTION_SIZES.editorsPicks);
    const trending = take(SECTION_SIZES.trending);
    const deepDives = take(SECTION_SIZES.deepDives);

    const remaining = formattedBlogs.slice(cursor);

    const categoryMap = {};
    remaining.forEach((blog) => {
      const key = blog.categorySlug || blog.categoryName || "general";
      if (!categoryMap[key]) {
        categoryMap[key] = {
          name: blog.categoryName || "General",
          slug: blog.categorySlug || "general",
          posts: [],
        };
      }
      categoryMap[key].posts.push(blog);
    });

    const feedCategories = Object.values(categoryMap)
      .filter((category) => category.posts.length >= 1)
      .map((category) => ({
        name: category.name,
        slug: category.slug,
        posts: category.posts.slice(0, 6),
      }))
      .slice(0, 6);

    const initialFeed = remaining.slice(0, 24);

    return {
      heroFeatured,
      heroGrid,
      editorsPicks,
      trending,
      deepDives,
      feedCategories,
      initialFeed,
      nextOffset: formattedBlogs.length,
    };
  } catch (error) {
    console.error("Error in getHomeLayout:", error);
    return null;
  }
}