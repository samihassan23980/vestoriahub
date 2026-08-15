import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import Category from "@/app/models/category";
import mongoose from "mongoose";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    // Configurable limits via query params, with safe defaults
    const categoryLimit = parseInt(searchParams.get("catLimit")) || 5; // How many categories to show
    const blogsPerCategory = parseInt(searchParams.get("blogLimit")) || 8; // Blogs per category

    // MongoDB Aggregation Pipeline
    const groupedBlogs = await Category.aggregate([
      // 1. Fetch only active categories explicitly marked as "blog" type
      {
        $match: {
          type: "blog",
          status: "active",
        },
      },
      // 2. Sort categories based on your custom UI ordering fields
      {
        $sort: { isFeatured: -1, sortOrder: 1, featuredOrder: 1 },
      },
      // 3. Limit to top N categories for the homepage
      {
        $limit: categoryLimit,
      },
      // 4. Join the Blogs (The "Hybrid" Approach)
      {
        $lookup: {
          from: "blogs", // Mongoose uses lowercase, pluralized collection names by default
          let: { categoryId: "$_id" },
          pipeline: [
            // Filter blogs belonging to this category, published, and not in the future
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$category", "$$categoryId"] },
                    { $eq: ["$status", "published"] },
                    { $lte: ["$publishedAt", new Date()] },
                  ],
                },
              },
            },
            // Sort by newest first
            { $sort: { publishedAt: -1 } },
            // Limit to 7-8 blogs per category
            { $limit: blogsPerCategory },
            // Project only the fields needed for the homepage cards (Extremely lightweight)
            {
              $project: {
                title: 1,
                slug: 1,
                excerpt: 1,
                featuredImage: 1,
                publishedAt: 1,
                readTimeMinutes: 1,
                author: 1,
                viewCount: 1,
                tags: 1,
              },
            },
          ],
          as: "blogs",
        },
      },
      // 5. Remove any categories that have 0 published blogs (Clean UI)
      {
        $match: {
          "blogs.0": { $exists: true },
        },
      },
      // 6. Clean up the final Category object to keep payload small
      {
        $project: {
          name: 1,
          slug: 1,
          shortDescription: 1,
          icon: 1,
          uiConfig: 1, // Useful if you want category specific theme colors on homepage
          blogs: 1,
        },
      },
    ]);

    return NextResponse.json(
      { success: true, data: groupedBlogs },
      {
        status: 200,
        headers: {
          // Hybrid Caching: Cache at CDN edge for 60 seconds, serve stale while revalidating for 1 hour.
          // This guarantees instantaneous load times while keeping content fresh.
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=3600",
        },
      },
    );
  } catch (error) {
    console.error("GET /public/home-blogs Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch homepage blogs." },
      { status: 500 },
    );
  }
}
