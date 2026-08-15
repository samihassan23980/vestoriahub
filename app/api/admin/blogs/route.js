import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/app/lib/mongodb";
import mongoose from "mongoose";

// Models (Imported to ensure Mongoose schema registration)
import Blog from "@/app/models/blog";
import Category from "@/app/models/category";
import User from "@/app/models/user";
import Store from "@/app/models/store";

// ============================================================================
// GET: Fetch list of blogs (Admin View)
// ============================================================================
export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    // Pagination basics
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;

    // Filters
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    // Build the dynamic query object
    const query = {};
    if (status) query.status = status;

    // Ensure category is a valid ObjectId before querying to prevent CastErrors
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        query.category = category;
      } else {
        return NextResponse.json(
          { 
            success: false, 
            error: "The selected category filter is invalid. Please select a valid category." 
          },
          { status: 400 },
        );
      }
    }

    // Full-text search (utilizes the contentText index defined in the schema)
    if (search) {
      query.$text = { $search: search };
    }

    // Fetch data with lean() for performance (removes heavy Mongoose document wrappers)
    const blogs = await Blog.find(query)
      .populate("category", "name slug")
      .populate("createdBy", "name")
      // Sort by text relevance if searching, otherwise newest first
      .sort(search ? { score: { $meta: "textScore" } } : { createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      // Exclude heavy HTML/Text fields to save bandwidth on list views
      .select("-content -contentText")
      .lean();

    const total = await Blog.countDocuments(query);

    return NextResponse.json(
      {
        success: true,
        data: blogs,
        pagination: {
          total,
          page,
          totalPages: Math.ceil(total / limit),
          limit,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/admin/blogs Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "We encountered a server issue while loading the blogs. Please try again later." 
      },
      { status: 500 },
    );
  }
}

// ============================================================================
// POST: Create a new blog post
// ============================================================================
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    // Extract admin ID from headers (assumes middleware sets this)
    const adminId = req.headers.get("x-user-id");

    // Initialize document (Schema pre-save hooks will handle slug formatting, read time, etc.)
    const newBlog = new Blog({
      ...body,
      createdBy: adminId || null,
      updatedBy: adminId || null,
    });

    await newBlog.save();

    // ⚡ ISR / SSG INTEGRATION:
    // If the post is published immediately, trigger an on-demand revalidation
    // of the blog listing page so the static site updates instantly.
    if (newBlog.status === "published") {
      revalidatePath("/blog"); // Revalidate main blog index
      revalidatePath("/"); // Revalidate homepage (if it shows latest posts)
    }

    // Clean up response payload to save bandwidth
    const responseBlog = newBlog.toObject();
    delete responseBlog.content;
    delete responseBlog.contentText;

    return NextResponse.json(
      {
        success: true,
        message: "Your blog post has been created successfully!",
        data: responseBlog,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/admin/blogs Error:", error);

    // ─── PROFESSIONAL & HUMAN-FRIENDLY ERROR HANDLING ─────────────────────────

    // 1. MongoDB Duplicate Key Error (e.g., Slug or Title already exists)
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyValue)[0];
      const duplicateValue = error.keyValue[duplicateField];
      
      // Make field name more readable for users
      let friendlyFieldName = duplicateField;
      if (duplicateField === "slug") friendlyFieldName = "URL slug";
      if (duplicateField === "title") friendlyFieldName = "blog title";

      return NextResponse.json(
        {
          success: false,
          error: `A post with this ${friendlyFieldName} ("${duplicateValue}") already exists. Please choose a different one to avoid duplicates.`,
        },
        { status: 409 },
      );
    }

    // 2. Mongoose Validation Error (Schema constraints violated)
    if (error.name === "ValidationError") {
      const validationMessages = Object.values(error.errors).map(
        (err) => err.message,
      );
      return NextResponse.json(
        {
          success: false,
          error: "Some required fields are missing or filled incorrectly. Please check your inputs.",
          details: validationMessages,
        },
        { status: 400 },
      );
    }

    // 3. Mongoose Cast Error (Invalid data types, usually bad ObjectIds like Category or User)
    if (error.name === "CastError") {
      let friendlyTarget = error.path;
      if (error.path === "category") friendlyTarget = "Category";
      if (error.path === "createdBy" || error.path === "updatedBy") friendlyTarget = "User account";

      return NextResponse.json(
        {
          success: false,
          error: `The value provided for '${friendlyTarget}' is invalid or improperly formatted. Please verify your selection.`,
        },
        { status: 400 },
      );
    }

    // 4. Generic/Unknown Error Fallback
    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong on our end while saving your blog post. Please try again.",
        details: process.env.NODE_ENV === "development" ? error.message : null,
      },
      { status: 500 },
    );
  }
}