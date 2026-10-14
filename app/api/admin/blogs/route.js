
/* app/api/admin/blogs/route.js */

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

import { connectDB } from "@/app/lib/mongodb";

import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSession,
} from "@/app/lib/authSession";

import { recordActivity } from "@/app/lib/activityLogger";

// Models imported to ensure Mongoose schema registration.
import Blog from "@/app/models/blog";
import Category from "@/app/models/category";
import User from "@/app/models/user";
import Store from "@/app/models/store";
import Coupon from "@/app/models/coupon";
import Country from "@/app/models/country";
import AffiliateNetwork from "@/app/models/affiliateNetwork";

// Authenticated API responses must not be cached.
export const dynamic = "force-dynamic";

// ============================================================
// BLOG PERMISSIONS
// ============================================================
//
// Align these roles with your existing Admin Layout.
//
// ============================================================

const BLOG_ALLOWED_ROLES = new Set([
  "admin",
  "manager",
  "seo_manager",
  "content_manager",
  "blog_editor",
]);

// ============================================================
// RESPONSE HELPERS
// ============================================================

function jsonError(
  message,
  status = 500,
  details = null
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details !== null ? { details } : {}),
    },
    { status }
  );
}

function jsonSuccess(data, status = 200) {
  return NextResponse.json(
    {
      success: true,
      ...data,
    },
    { status }
  );
}

// ============================================================
// COMMON HELPERS
// ============================================================

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : fallback;
}

// ============================================================
// SLUG SANITIZER
// ============================================================
//
// Removes:
// - Leading/trailing slashes
// - Special characters
// - Repeated hyphens
//
// Converts spaces to hyphens.
//
// ============================================================

function sanitizeSlug(val = "") {
  return String(val)
    .toLowerCase()
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ============================================================
// SECURE JWT AUTHENTICATION
// ============================================================
//
// Never trust:
// - x-user-id headers
// - user_role cookies
// - Request body createdBy / updatedBy
// - localStorage
//
// Only a verified JWT and current database user determine
// employee identity and permissions.
//
// ============================================================

async function getAuthenticatedBlogUser(req) {
  const token = req.cookies.get(
    ADMIN_SESSION_COOKIE
  )?.value;

  if (!token) {
    return {
      error: jsonError(
        "Authentication required. Please sign in.",
        401
      ),
    };
  }

  const session = await verifyAdminSession(token);

  if (
    !session ||
    !session.userId ||
    !isValidObjectId(session.userId)
  ) {
    return {
      error: jsonError(
        "Invalid or expired session. Please sign in again.",
        401
      ),
    };
  }

  // Always read current employee permissions from DB.
  const user = await User.findById(session.userId)
    .select("_id name email role status")
    .lean();

  if (!user) {
    return {
      error: jsonError(
        "Your account no longer exists.",
        401
      ),
    };
  }

  if (user.status === "disabled") {
    return {
      error: jsonError(
        "Your account has been deactivated.",
        403
      ),
    };
  }

  // JWT role must match current database role.
  if (user.role !== session.role) {
    return {
      error: jsonError(
        "Your permissions have changed. Please sign in again.",
        401
      ),
    };
  }

  if (!BLOG_ALLOWED_ROLES.has(user.role)) {
    return {
      error: jsonError(
        "You do not have permission to access blogs.",
        403
      ),
    };
  }

  return {
    user: {
      _id: user._id,
      name: user.name || "",
      email: user.email || "",
      role: user.role,
    },
  };
}

// ============================================================
// SAFE ACTIVITY LOGGER
// ============================================================
//
// Activity logging is best-effort.
//
// A logging failure must not undo a successfully created blog.
//
// ============================================================

async function safelyRecordBlogActivity(options) {
  try {
    await recordActivity(options);
  } catch (error) {
    console.error(
      "Blog activity logging failed:",
      error
    );
  }
}

// ============================================================
// SAFE CACHE REVALIDATION
// ============================================================
//
// Preserve existing ISR paths.
//
// ============================================================

function safelyRevalidateBlogPaths() {
  const paths = [
    "/blog",
    "/blogs",
    "/",
  ];

  for (const path of paths) {
    try {
      revalidatePath(path);
    } catch (error) {
      console.error(
        `Failed to revalidate blog path "${path}":`,
        error
      );
    }
  }
}

// ============================================================
// GET /api/admin/blogs
// ============================================================
//
// Preserved:
// - Status filter
// - Category filter
// - MongoDB text search
// - Text score sorting
// - Created date sorting
// - Pagination
// - Category population
// - Creator population
// - Exclusion of content and contentText
// - Existing response structure
//
// Added:
// - JWT authentication and authorization
//
// ============================================================

export async function GET(req) {
  try {
    await connectDB();

    // ========================================================
    // AUTHENTICATE EMPLOYEE
    // ========================================================

    const auth = await getAuthenticatedBlogUser(req);

    if (auth.error) {
      return auth.error;
    }

    const { searchParams } = new URL(req.url);

    // ========================================================
    // PAGINATION
    // ========================================================

    const page = parsePositiveInt(
      searchParams.get("page"),
      1
    );

    const limit = parsePositiveInt(
      searchParams.get("limit"),
      10
    );

    // ========================================================
    // FILTERS
    // ========================================================

    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const query = {};

    if (status) {
      query.status = status;
    }

    if (category) {
      if (isValidObjectId(category)) {
        query.category = category;
      } else {
        return jsonError(
          "The selected category filter is invalid. Please select a valid category.",
          400
        );
      }
    }

    // ========================================================
    // MONGODB TEXT SEARCH
    // ========================================================

    if (search) {
      query.$text = {
        $search: search,
      };
    }

    // ========================================================
    // BLOG QUERY
    // ========================================================
    //
    // Avoid including large editor content in admin list.
    //
    // ========================================================

    let dbQuery = Blog.find(query);

    if (search) {
      // Text search score is included for sorting.
      // Large content fields remain excluded.
      dbQuery = dbQuery
        .select({
          score: {
            $meta: "textScore",
          },
        })
        .select("-content -contentText")
        .sort({
          score: {
            $meta: "textScore",
          },
        });
    } else {
      dbQuery = dbQuery
        .select("-content -contentText")
        .sort({
          createdAt: -1,
        });
    }

    // ========================================================
    // FETCH BLOGS
    // ========================================================

    const blogs = await dbQuery
      .populate("category", "name slug")
      .populate("createdBy", "name")
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await Blog.countDocuments(query);

    // ========================================================
    // PRESERVE ORIGINAL RESPONSE
    // ========================================================

    return jsonSuccess(
      {
        data: blogs,

        pagination: {
          total,
          page,
          totalPages: Math.ceil(total / limit),
          limit,
        },
      },
      200
    );
  } catch (error) {
    console.error(
      "GET /api/admin/blogs Error:",
      error
    );

    return jsonError(
      "We encountered a server issue while loading the blogs. Please try again later.",
      500
    );
  }
}

// ============================================================
// POST /api/admin/blogs
// ============================================================
//
// Preserved:
// - Original request body fields
// - Slug sanitization
// - Mongoose validation
// - Duplicate slug/title error handling
// - Cast error handling
// - ISR revalidation
// - Response content exclusion
// - Original response structure
//
// Added:
// - JWT authentication
// - Trusted createdBy and updatedBy
// - Blog created activity
// - Blog published activity
//
// ============================================================

export async function POST(req) {
  try {
    await connectDB();

    // ========================================================
    // AUTHENTICATE EMPLOYEE
    // ========================================================

    const auth = await getAuthenticatedBlogUser(req);

    if (auth.error) {
      return auth.error;
    }

    const authenticatedUser = auth.user;

    // ========================================================
    // REQUEST BODY
    // ========================================================

    const body = await req.json();

    // ========================================================
    // SERVER-SIDE SLUG SANITIZATION
    // ========================================================
    //
    // Slashes are never stored in the slug.
    //
    // ========================================================

    const rawSlug =
      body.slug || body.title || "";

    const cleanSlug = sanitizeSlug(rawSlug);

    if (!cleanSlug) {
      return jsonError(
        "A valid URL slug is required.",
        400
      );
    }

    // ========================================================
    // CREATE BLOG WITH TRUSTED EMPLOYEE ID
    // ========================================================
    //
    // Do not accept createdBy/updatedBy from body or headers.
    //
    // ========================================================

    const newBlog = new Blog({
      ...body,

      slug: cleanSlug,

      createdBy: authenticatedUser._id,
      updatedBy: authenticatedUser._id,
    });

    await newBlog.save();

    // ========================================================
    // ACTIVITY TARGET SNAPSHOT
    // ========================================================
    //
    // Store only blog identity.
    // Do not store HTML, editor content or SEO fields.
    //
    // ========================================================

    const blogTarget = {
      _id: newBlog._id,

      name:
        newBlog.title ||
        "Untitled Blog",

      slug: newBlog.slug,

      url: `/blogs/${newBlog.slug}`,
    };

    // ========================================================
    // BLOG CREATED ACTIVITY
    // ========================================================

    await safelyRecordBlogActivity({
      actor: authenticatedUser,

      module: "blog",
      action: "created",

      target: blogTarget,
    });

    // ========================================================
    // BLOG PUBLISHED ACTIVITY
    // ========================================================
    //
    // A directly published blog records:
    // 1. created
    // 2. published
    //
    // Draft creation records only "created".
    //
    // ========================================================

    if (newBlog.status === "published") {
      await safelyRecordBlogActivity({
        actor: authenticatedUser,

        module: "blog",
        action: "published",

        target: blogTarget,
      });
    }

    // ========================================================
    // ISR CACHE REVALIDATION
    // ========================================================

    if (newBlog.status === "published") {
      safelyRevalidateBlogPaths();
    }

    // ========================================================
    // RESPONSE SANITIZATION
    // ========================================================
    //
    // Preserve original response behavior.
    //
    // ========================================================

    const responseBlog = newBlog.toObject();

    delete responseBlog.content;
    delete responseBlog.contentText;

    // ========================================================
    // SUCCESS RESPONSE
    // ========================================================

    return jsonSuccess(
      {
        message:
          "Your blog post has been created successfully!",

        data: responseBlog,
      },
      201
    );
  } catch (error) {
    console.error(
      "POST /api/admin/blogs Error:",
      error
    );

    // ========================================================
    // 1. MONGODB DUPLICATE KEY ERROR
    // ========================================================

    if (error.code === 11000) {
      const duplicateField =
        Object.keys(error.keyValue || {})[0] ||
        "field";

      const duplicateValue = error.keyValue
        ? error.keyValue[duplicateField]
        : "";

      let friendlyFieldName = duplicateField;

      if (duplicateField === "slug") {
        friendlyFieldName = "URL slug";
      }

      if (duplicateField === "title") {
        friendlyFieldName = "blog title";
      }

      return jsonError(
        `A post with this ${friendlyFieldName} ("${duplicateValue}") already exists. Please choose a different one to avoid duplicates.`,
        409
      );
    }

    // ========================================================
    // 2. MONGOOSE VALIDATION ERROR
    // ========================================================

    if (error.name === "ValidationError") {
      const validationMessages = Object.values(
        error.errors || {}
      ).map((err) => err.message);

      return jsonError(
        "Some required fields are missing or filled incorrectly. Please check your inputs.",
        400,
        validationMessages
      );
    }

    // ========================================================
    // 3. MONGOOSE CAST ERROR
    // ========================================================

    if (error.name === "CastError") {
      let friendlyTarget = error.path;

      if (error.path === "category") {
        friendlyTarget = "Category";
      }

      if (
        error.path === "createdBy" ||
        error.path === "updatedBy"
      ) {
        friendlyTarget = "User account";
      }

      return jsonError(
        `The value provided for '${friendlyTarget}' is invalid or improperly formatted. Please verify your selection.`,
        400
      );
    }

    // ========================================================
    // 4. GENERIC SERVER FALLBACK
    // ========================================================

    return jsonError(
      "Something went wrong on our end while saving your blog post. Please try again.",
      500,
      process.env.NODE_ENV === "development"
        ? error.message
        : null
    );
  }
}
