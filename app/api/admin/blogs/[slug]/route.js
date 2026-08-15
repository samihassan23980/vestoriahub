import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache"; // 🔥 Added for PUT & DELETE Cache purging
import { connectDB } from "@/app/lib/mongodb";
import Blog from "@/app/models/blog";
import Category from "@/app/models/category"; // Required for populate to work
import Store from "@/app/models/store"; // Required for populate to work

import mongoose from "mongoose";
// ============================================================================
// GET: Fetch a single blog post BY SLUG
// ============================================================================
export async function GET(req, { params }) {
  try {
    await connectDB();

    // 🔥 NEXT.JS 15 FIX: Destructure after awaiting params
    const resolvedParams = await params;
    const rawSlug = resolvedParams?.slug;

    if (!rawSlug) {
      return NextResponse.json(
        { success: false, error: "Slug is required" },
        { status: 400 },
      );
    }

    const slug = rawSlug.toLowerCase().trim();

    // Fetch the blog post by slug (removed status restriction so drafts can be fetched for editing)
    const blog = await Blog.findOne({ slug })
      .populate("category", "name slug shortDescription")
      .populate("relatedStores", "name slug images.logo deals") // Ensure you match Store schema fields
      // .populate("author.userRef", "name role avatar") // Uncomment if author is an ObjectId ref in your schema
      .lean();

    if (!blog) {
      return NextResponse.json(
        { success: false, error: "Blog not found" },
        { status: 404 },
      );
    }

    // Increment View Count only if published (Fire & Forget, non-blocking)
    if (blog.status === "published") {
      Blog.updateOne({ _id: blog._id }, { $inc: { viewCount: 1 } }).exec();
    }

    // Fetch related posts (Same category, excluding current post, published only)
    const related = await Blog.find({
      category: blog.category?._id,
      _id: { $ne: blog._id },
      status: "published",
    })
      .select(
        "title slug excerpt featuredImage publishedAt readTimeMinutes category",
      )
      .populate("category", "name")
      .sort({ publishedAt: -1 })
      .limit(3)
      .lean();

    return NextResponse.json(
      { success: true, data: blog, related },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /public/blogs/[slug] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load blog" },
      { status: 500 },
    );
  }
}

// ============================================================================
// PUT: Update an existing blog post BY SLUG
// ============================================================================
export async function PUT(req, { params }) {
  try {
    await connectDB();

    // 🔥 NEXT.JS 15 FIX: Await params
    const resolvedParams = await params;
    const paramSlug = resolvedParams?.slug?.toLowerCase().trim();

    if (!paramSlug) {
      return NextResponse.json(
        { success: false, error: "Slug is required." },
        { status: 400 },
      );
    }

    const body = await req.json();
    const adminId = req.headers.get("x-user-id");

    const blog = await Blog.findOne({ slug: paramSlug });

    if (!blog) {
      return NextResponse.json(
        { success: false, error: "Blog post not found." },
        { status: 404 },
      );
    }

    const oldSlug = blog.slug;
    const oldStatus = blog.status;

    // Apply updates
    Object.assign(blog, body);
    if (adminId) blog.updatedBy = adminId;

    await blog.save();

    // ⚡ ISR Cache Purge (Clears frontend cache instantly)
    if (oldStatus === "published" || blog.status === "published") {
      revalidatePath("/blog");
      revalidatePath("/blogs");
      revalidatePath("/");
      revalidatePath(`/blogs/${oldSlug}`);
      if (blog.slug && blog.slug !== oldSlug) {
        revalidatePath(`/blogs/${blog.slug}`);
      }
    }

    const responseBlog = blog.toObject();
    delete responseBlog.content;
    delete responseBlog.contentText;

    return NextResponse.json(
      {
        success: true,
        message: "Blog post updated successfully.",
        data: responseBlog,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("PUT /blogs/[slug] Error:", error);
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyValue)[0];
      return NextResponse.json(
        { success: false, error: `The ${duplicateField} is already in use.` },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Update failed." },
      { status: 500 },
    );
  }
}

// ============================================================================
// DELETE: Remove a blog post BY SLUG
// ============================================================================
export async function DELETE(req, { params }) {
  try {
    await connectDB();

    // 🔥 NEXT.JS 15 FIX: Await params
    const resolvedParams = await params;
    const identifier = resolvedParams?.slug?.toLowerCase().trim();

    if (!identifier) {
      return NextResponse.json(
        { success: false, error: "Blog ID or Slug is required." },
        { status: 400 },
      );
    }

    // 🔥 Dynamic Query: Check if the identifier is a valid MongoDB _id
    const isObjectId = mongoose.Types.ObjectId.isValid(identifier);
    const query = isObjectId ? { _id: identifier } : { slug: identifier };

    // Execute the delete operation based on the dynamic query
    const deletedBlog = await Blog.findOneAndDelete(query);

    if (!deletedBlog) {
      return NextResponse.json(
        { success: false, error: "Blog post not found." },
        { status: 404 },
      );
    }

    // ⚡ ISR Cache Purge
    if (deletedBlog.status === "published") {
      revalidatePath("/blog");
      revalidatePath("/blogs");
      revalidatePath("/");
      revalidatePath(`/blogs/${deletedBlog.slug}`);
    }

    return NextResponse.json(
      { success: true, message: "Blog post deleted successfully." },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE /blogs/[slug] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete blog." },
      { status: 500 },
    );
  }
}