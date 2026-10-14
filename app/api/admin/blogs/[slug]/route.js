
/* app/api/admin/blogs/[slug]/route.js */

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/app/lib/mongodb";
import mongoose from "mongoose";

import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSession,
} from "@/app/lib/authSession";

import { recordActivity } from "@/app/lib/activityLogger";

// Models (Schema registration ke liye zaroori imports)
import Blog from "@/app/models/blog";
import Category from "@/app/models/category";
import User from "@/app/models/user";
import Store from "@/app/models/store";
import Coupon from "@/app/models/coupon";
import Country from "@/app/models/country";
import AffiliateNetwork from "@/app/models/affiliateNetwork";

// Never cache authenticated API responses.
export const dynamic = "force-dynamic";

// ============================================================
// BLOG PERMISSIONS
// ============================================================
//
// Same roles as:
// app/api/admin/blogs/route.js
//
// In roles ko apne Admin Layout ke actual permissions
// ke saath match rakhna zaroori hai.
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

function jsonError(message, status = 500, details = null) {
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

// ============================================================
// HELPER: SANITIZE SLUG / IDENTIFIER
// ============================================================
//
// Existing behavior preserved:
// - URL decode
// - Trim
// - Lowercase
// - Remove leading/trailing slashes
//
// Malformed URI encoding is handled safely.
//
// ============================================================

function cleanIdentifier(val = "") {
  let decoded = String(val);

  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // Keep original value if URI decoding fails.
  }

  return decoded
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "");
}

// ============================================================
// HELPER: BUILD BLOG QUERY
// ============================================================
//
// Supports:
// - MongoDB ObjectId
// - Normal slug
// - Legacy slug starting with "/"
//
// ============================================================

function buildBlogQuery(identifier) {
  if (isValidObjectId(identifier)) {
    return {
      _id: identifier,
    };
  }

  return {
    $or: [
      { slug: identifier },
      { slug: `/${identifier}` },
    ],
  };
}

// ============================================================
// SECURE JWT AUTHENTICATION
// ============================================================
//
// Never trust:
// - x-user-id header
// - user_role cookie
// - Request body createdBy / updatedBy
// - localStorage
//
// Employee identity comes only from verified JWT and DB.
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

  // Current DB role must match signed JWT role.
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
// HELPER: ACTIVITY TARGET
// ============================================================
//
// Only identity is stored.
//
// No blog content, HTML, SEO metadata, FAQs,
// embedded blocks or other field values are logged.
//
// ============================================================

function buildBlogActivityTarget(blog) {
  const slug = cleanIdentifier(blog.slug || "");

  return {
    _id: blog._id,

    name: blog.title || "Untitled Blog",

    slug,

    url: slug ? `/blogs/${slug}` : "",
  };
}

// ============================================================
// HELPER: SAFE ACTIVITY LOGGING
// ============================================================
//
// Logging is best-effort.
//
// A successful Blog update/delete must not be undone
// because the activity log failed.
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
// HELPER: SAFE ISR REVALIDATION
// ============================================================
//
// Existing public paths preserved.
//
// ============================================================

function safelyRevalidateBlogPaths(slugs = []) {
  const paths = new Set([
    "/blog",
    "/blogs",
    "/",
  ]);

  for (const rawSlug of slugs) {
    if (!rawSlug) continue;

    const slug = cleanIdentifier(rawSlug);

    if (slug) {
      paths.add(`/blogs/${slug}`);
    }
  }

  for (const path of paths) {
    try {
      revalidatePath(path);
    } catch (error) {
      console.error(
        `Blog cache revalidation failed for "${path}":`,
        error
      );
    }
  }
}

// ============================================================
// GET: FETCH SINGLE BLOG BY SLUG OR ID
// ============================================================
//
// Preserved:
// - Slug or ObjectId lookup
// - Legacy leading-slash slug fallback
// - Category population
// - Related Stores population
// - Published blog view count
// - Related published posts
// - Existing response structure
//
// Added:
// - JWT authentication and authorization
//
// ============================================================

export async function GET(req, { params }) {
  try {
    await connectDB();

    // ========================================================
    // AUTHENTICATE EMPLOYEE
    // ========================================================

    const auth = await getAuthenticatedBlogUser(req);

    if (auth.error) {
      return auth.error;
    }

    // ========================================================
    // RESOLVE SLUG / ID
    // ========================================================

    const resolvedParams = await params;

    const rawIdentifier = resolvedParams?.slug;

    if (!rawIdentifier) {
      return jsonError(
        "Slug or ID is required.",
        400
      );
    }

    const identifier = cleanIdentifier(rawIdentifier);

    if (!identifier) {
      return jsonError(
        "Slug or ID is required.",
        400
      );
    }

    const query = buildBlogQuery(identifier);

    // ========================================================
    // FETCH BLOG
    // ========================================================

    const blog = await Blog.findOne(query)
      .populate(
        "category",
        "name slug shortDescription"
      )
      .populate(
        "relatedStores",
        "name slug images.logo deals"
      )
      .lean();

    if (!blog) {
      return jsonError(
        "Blog post not found.",
        404
      );
    }

    // ========================================================
    // INCREMENT VIEW COUNT ONLY IF PUBLISHED
    // ========================================================
    //
    // Preserve existing behavior.
    //
    // Await to avoid an unhandled background DB promise.
    //
    // ========================================================

    if (blog.status === "published") {
      try {
        await Blog.updateOne(
          { _id: blog._id },
          {
            $inc: {
              viewCount: 1,
            },
          }
        );
      } catch (viewError) {
        console.error(
          "Failed to increment blog view count:",
          viewError
        );
      }
    }

    // ========================================================
    // RELATED POSTS
    // ========================================================

    let related = [];

    if (blog.category?._id) {
      related = await Blog.find({
        category: blog.category._id,

        _id: {
          $ne: blog._id,
        },

        status: "published",
      })
        .select(
          "title slug excerpt featuredImage publishedAt readTimeMinutes category"
        )
        .populate("category", "name")
        .sort({
          publishedAt: -1,
        })
        .limit(3)
        .lean();
    }

    // ========================================================
    // ORIGINAL RESPONSE STRUCTURE
    // ========================================================

    return jsonSuccess(
      {
        data: blog,
        related,
      },
      200
    );
  } catch (error) {
    console.error(
      "GET /api/admin/blogs/[slug] Error:",
      error
    );

    return jsonError(
      "Failed to load blog.",
      500
    );
  }
}

// ============================================================
// PUT: UPDATE BLOG BY SLUG OR ID
// ============================================================
//
// Preserved:
// - Slug / ObjectId lookup
// - Allowed fields whitelist
// - Slug sanitization
// - Existing Mongoose validation
// - Existing response structure
// - ISR revalidation
//
// Added:
// - JWT authentication
// - Trusted updatedBy
// - Blog updated activity
// - Published/unpublished activity
//
// ============================================================

export async function PUT(req, { params }) {
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
    // RESOLVE SLUG / ID
    // ========================================================

    const resolvedParams = await params;

    const rawIdentifier = resolvedParams?.slug;

    if (!rawIdentifier) {
      return jsonError(
        "Slug or ID is required.",
        400
      );
    }

    const identifier = cleanIdentifier(rawIdentifier);

    if (!identifier) {
      return jsonError(
        "Slug or ID is required.",
        400
      );
    }

    const query = buildBlogQuery(identifier);

    // ========================================================
    // FIND EXISTING BLOG
    // ========================================================

    const blog = await Blog.findOne(query);

    if (!blog) {
      return jsonError(
        "Blog post not found.",
        404
      );
    }

    // ========================================================
    // REQUEST BODY
    // ========================================================

    const body = await req.json();

    // ========================================================
    // ORIGINAL VALUES BEFORE UPDATE
    // ========================================================

    const oldSlug = blog.slug;
    const oldStatus = blog.status;

    // ========================================================
    // ALLOWED FIELDS
    // ========================================================
    //
    // Security:
    // - _id cannot be changed
    // - createdBy cannot be changed
    // - viewCount cannot be changed
    // - updatedBy is set from JWT only
    //
    // ========================================================

    const allowedFields = [
      "title",
      "slug",
      "excerpt",
      "content",
      "category",
      "tags",
      "featuredImage",
      "author",
      "status",
      "relatedStores",
      "faqs",
      "embeddedBlocks",
      "seo",
    ];

    // ========================================================
    // APPLY ALLOWED FIELDS
    // ========================================================

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        if (field === "slug") {
          // Preserve existing slug sanitization behavior.
          blog.slug = cleanIdentifier(
            body.slug || blog.slug
          );
        } else {
          blog[field] = body[field];
        }
      }
    });

    // ========================================================
    // TRUSTED EMPLOYEE ID
    // ========================================================
    //
    // No x-user-id header or client-supplied user ID.
    //
    // ========================================================

    blog.updatedBy = authenticatedUser._id;

    // ========================================================
    // SAVE BLOG
    // ========================================================

    await blog.save();

    // ========================================================
    // ACTIVITY TARGET
    // ========================================================

    const blogTarget = buildBlogActivityTarget(blog);

    // ========================================================
    // BLOG UPDATED ACTIVITY
    // ========================================================
    //
    // Records generic "updated" event.
    // No old/new content or SEO snapshots.
    //
    // ========================================================

    await safelyRecordBlogActivity({
      actor: authenticatedUser,

      module: "blog",
      action: "updated",

      target: blogTarget,
    });

    // ========================================================
    // STATUS TRANSITION ACTIVITY
    // ========================================================
    //
    // draft -> published     = published
    // archived -> published  = published
    // published -> draft     = unpublished
    // published -> archived  = unpublished
    //
    // No status-change event when status remains unchanged.
    //
    // ========================================================

    const newStatus = blog.status;

    if (
      oldStatus !== "published" &&
      newStatus === "published"
    ) {
      await safelyRecordBlogActivity({
        actor: authenticatedUser,

        module: "blog",
        action: "published",

        target: blogTarget,
      });
    }

    if (
      oldStatus === "published" &&
      newStatus !== "published"
    ) {
      await safelyRecordBlogActivity({
        actor: authenticatedUser,

        module: "blog",
        action: "unpublished",

        target: blogTarget,
      });
    }

    // ========================================================
    // ISR CACHE REVALIDATION
    // ========================================================

    if (
      oldStatus === "published" ||
      newStatus === "published"
    ) {
      safelyRevalidateBlogPaths([
        oldSlug,
        blog.slug,
      ]);
    }

    // ========================================================
    // RESPONSE SANITIZATION
    // ========================================================

    const responseBlog = blog.toObject();

    delete responseBlog.content;
    delete responseBlog.contentText;

    // ========================================================
    // ORIGINAL RESPONSE STRUCTURE
    // ========================================================

    return jsonSuccess(
      {
        message:
          "Blog post updated successfully.",

        data: responseBlog,
      },
      200
    );
  } catch (error) {
    console.error(
      "PUT /api/admin/blogs/[slug] Error:",
      error
    );

    // ========================================================
    // DUPLICATE KEY ERROR
    // ========================================================

    if (error.code === 11000) {
      const duplicateField =
        Object.keys(error.keyValue || {})[0] ||
        "field";

      return jsonError(
        `The ${duplicateField} is already in use.`,
        409
      );
    }

    // ========================================================
    // MONGOOSE VALIDATION ERROR
    // ========================================================

    if (error.name === "ValidationError") {
      const validationMessages = Object.values(
        error.errors || {}
      ).map((err) => err.message);

      return jsonError(
        "Some required fields are missing or invalid.",
        400,
        validationMessages
      );
    }

    // ========================================================
    // GENERIC ERROR
    // ========================================================

    return jsonError(
      "Update failed.",
      500
    );
  }
}

// ============================================================
// DELETE: REMOVE BLOG BY SLUG OR ID
// ============================================================
//
// Preserved:
// - Slug / ObjectId lookup
// - Existing response structure
// - Published blog cache revalidation
//
// Added:
// - JWT authentication
// - Employee identity
// - Blog deleted activity
//
// ============================================================

export async function DELETE(req, { params }) {
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
    // RESOLVE SLUG / ID
    // ========================================================

    const resolvedParams = await params;

    const rawIdentifier = resolvedParams?.slug;

    if (!rawIdentifier) {
      return jsonError(
        "Blog ID or Slug is required.",
        400
      );
    }

    const identifier = cleanIdentifier(rawIdentifier);

    if (!identifier) {
      return jsonError(
        "Blog ID or Slug is required.",
        400
      );
    }

    const query = buildBlogQuery(identifier);

    // ========================================================
    // DELETE BLOG
    // ========================================================

    const deletedBlog = await Blog.findOneAndDelete(query);

    if (!deletedBlog) {
      return jsonError(
        "Blog post not found.",
        404
      );
    }

    // ========================================================
    // BLOG DELETED ACTIVITY
    // ========================================================
    //
    // Snapshot is built from deleted document.
    //
    // ========================================================

    await safelyRecordBlogActivity({
      actor: authenticatedUser,

      module: "blog",
      action: "deleted",

      target: buildBlogActivityTarget(deletedBlog),
    });

    // ========================================================
    // ISR CACHE REVALIDATION
    // ========================================================

    if (deletedBlog.status === "published") {
      safelyRevalidateBlogPaths([
        deletedBlog.slug,
      ]);
    }

    // ========================================================
    // ORIGINAL RESPONSE STRUCTURE
    // ========================================================

    return jsonSuccess(
      {
        message:
          "Blog post deleted successfully.",
      },
      200
    );
  } catch (error) {
    console.error(
      "DELETE /api/admin/blogs/[slug] Error:",
      error
    );

    return jsonError(
      "Failed to delete blog.",
      500
    );
  }
}
