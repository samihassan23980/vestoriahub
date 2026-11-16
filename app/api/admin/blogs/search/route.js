/* app/api/admin/blogs/search/route.js */

import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/app/lib/mongodb";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/app/lib/authSession";

import Blog from "@/app/models/blog";
import Category from "@/app/models/category";
import User from "@/app/models/user";
import Store from "@/app/models/store";
import Coupon from "@/app/models/coupon";
import Country from "@/app/models/country";
import AffiliateNetwork from "@/app/models/affiliateNetwork";

export const dynamic = "force-dynamic";

const BLOG_ALLOWED_ROLES = new Set([
  "admin",
  "manager",
  "seo_manager",
  "content_manager",
  "blog_editor",
]);

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function jsonError(message, status = 500, details = null) {
  return NextResponse.json(
    { success: false, error: message, ...(details !== null ? { details } : {}) },
    { status }
  );
}

function jsonSuccess(data, status = 200) {
  return NextResponse.json({ success: true, ...data }, { status });
}

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getAuthenticatedBlogUser(req) {
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return { error: jsonError("Authentication required. Please sign in.", 401) };

  const session = await verifyAdminSession(token);
  if (!session || !session.userId || !isValidObjectId(session.userId)) {
    return { error: jsonError("Invalid or expired session. Please sign in again.", 401) };
  }

  const user = await User.findById(session.userId).select("_id name email role status").lean();
  if (!user) return { error: jsonError("Your account no longer exists.", 401) };
  if (user.status === "disabled") return { error: jsonError("Your account has been deactivated.", 403) };
  if (user.role !== session.role) return { error: jsonError("Your permissions have changed.", 401) };
  if (!BLOG_ALLOWED_ROLES.has(user.role)) return { error: jsonError("Permission denied.", 403) };

  return { user };
}

export async function GET(req) {
  try {
    await connectDB();

    const auth = await getAuthenticatedBlogUser(req);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);

    const page = parsePositiveInt(searchParams.get("page"), 1);
    const limit = Math.min(MAX_LIMIT, parsePositiveInt(searchParams.get("limit"), DEFAULT_LIMIT));
    const skip = (page - 1) * limit;

    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const search = searchParams.get("search")?.trim();

    // 1. Build Query Filter using optimized Regex instead of heavy $text search
    const queryFilter = {};

    if (status) {
      queryFilter.status = status;
    }

    if (category) {
      if (isValidObjectId(category)) {
        queryFilter.category = category;
      } else {
        return jsonError("Invalid category ID filter.", 400);
      }
    }

    if (search) {
      const safeQuery = escapeRegExp(search);
      queryFilter.$or = [
        { title: { $regex: safeQuery, $options: "i" } },
        { slug: { $regex: safeQuery, $options: "i" } },
        { excerpt: { $regex: safeQuery, $options: "i" } },
      ];
    }

    // 2. Execute Parallel Query with Lean and strict execution timeouts
    const [blogs, total] = await Promise.all([
      Blog.find(queryFilter)
        .select("-content -contentText") // Exclude heavy editor fields
        .populate("category", "name slug")
        .populate("createdBy", "name")
        .sort({ createdAt: -1 }) // Sorting by indexed creation date is vastly faster than textScore
        .skip(skip)
        .limit(limit)
        .lean()
        .maxTimeMS(3000), // Fail fast if MongoDB slows down
      Blog.countDocuments(queryFilter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return jsonSuccess(
      {
        data: blogs,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasMore: page < totalPages,
        },
      },
      200
    );
  } catch (error) {
    console.error("GET /api/admin/blogs/search Error:", error);
    return jsonError("Search query timed out or failed.", 500, error.message);
  }
}