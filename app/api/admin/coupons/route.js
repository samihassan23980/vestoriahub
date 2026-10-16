
/* app/api/admin/coupons/route.js */

import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/app/lib/mongodb";

import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSession,
} from "@/app/lib/authSession";

import { recordActivity } from "@/app/lib/activityLogger";

import Coupon from "@/app/models/coupon";
import Store from "@/app/models/store";
import User from "@/app/models/user";

// Register referenced models for population.
import Category from "@/app/models/category";

export const dynamic = "force-dynamic";

// ============================================================
// COUPON ACCESS ROLES
// ============================================================
//
// Keep aligned with your admin permission configuration.
// Coupon write access is limited to authorized roles.
//
// ============================================================

const COUPON_ALLOWED_ROLES = new Set([
  "super_admin",
  "admin",
  "manager",
  "seo_manager",
  "content_manager",
  "store_editor",
  "coupon_editor",
]);

// ============================================================
// COMMON HELPERS
// ============================================================

function toNumber(value, fallback) {
  const num = Number(value);

  return Number.isFinite(num) && num > 0
    ? num
    : fallback;
}

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function jsonError(message, status = 500, details = null) {
  return NextResponse.json(
    {
      error: message,
      ...(details ? { details } : {}),
    },
    { status }
  );
}

// ============================================================
// SECURE JWT AUTHENTICATION
// ============================================================
//
// Never trust employee IDs from:
// - Request body
// - x-user-id headers
// - localStorage
// - Unsigned role cookies
//
// Employee identity is resolved from verified JWT and DB.
//
// ============================================================

async function getAuthenticatedCouponUser(req) {
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

  if (user.role !== session.role) {
    return {
      error: jsonError(
        "Your permissions have changed. Please sign in again.",
        401
      ),
    };
  }

  if (!COUPON_ALLOWED_ROLES.has(user.role)) {
    return {
      error: jsonError(
        "You do not have permission to access coupons.",
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
// COUPON PAYLOAD NORMALIZATION
// ============================================================
//
// All original fields and defaults preserved.
//
// ============================================================

function normalizeCouponPayload(body = {}) {
  const payload = {
    title: body.title,
    subtitle: body.subtitle || "",
    terms: body.terms || "",

    trackingLink: body.trackingLink,

    type: body.type,
    codeType: body.codeType,
    code: body.code || "",

    discountType: body.discountType,
    discountValue: Number(body.discountValue ?? 0),

    maxDiscountCap:
      body.maxDiscountCap === "" ||
      body.maxDiscountCap == null
        ? null
        : Number(body.maxDiscountCap),

    minOrderValue: Number(body.minOrderValue ?? 0),

    expiryDate: body.expiryDate
      ? new Date(body.expiryDate)
      : null,

    status: body.status || "active",

    isVerified: Boolean(body.isVerified),

    verifiedAt: body.isVerified
      ? body.verifiedAt
        ? new Date(body.verifiedAt)
        : new Date()
      : null,

    isExclusive: Boolean(body.isExclusive),

    countryCode: body.countryCode || "GLOBAL",

    sortOrder:
      body.sortOrder === "" ||
      body.sortOrder == null
        ? 1000
        : Number(body.sortOrder),

    isPinned: Boolean(body.isPinned),

    storeId: body.storeId,
    categoryId: body.categoryId,

    secondaryCategoryIds: Array.isArray(
      body.secondaryCategoryIds
    )
      ? body.secondaryCategoryIds.filter(Boolean)
      : [],
  };

  return payload;
}

// ============================================================
// SAFE ACTIVITY LOGGER
// ============================================================
//
// Logging is best-effort.
// A logging failure must not undo a successful coupon create.
//
// ============================================================

async function safelyRecordCouponActivity(options) {
  try {
    await recordActivity(options);
  } catch (error) {
    console.error(
      "Coupon activity logging failed:",
      error
    );
  }
}

// ============================================================
// GET /api/admin/coupons
// ============================================================
//
// Preserved:
// - Pagination
// - Store filter
// - Category filter
// - Status filter
// - Type filter
// - Code type filter
// - Discount type filter
// - Country filter
// - Verified filter
// - Exclusive filter
// - Pinned filter
// - Search
// - Population
// - Sorting
// - Existing response structure
//
// ============================================================

export async function GET(req) {
  try {
    await connectDB();

    // Authenticate current employee.
    const auth = await getAuthenticatedCouponUser(req);

    if (auth.error) {
      return auth.error;
    }

    const { searchParams } = new URL(req.url);

    const page = toNumber(
      searchParams.get("page"),
      1
    );

    const limit = Math.min(
      toNumber(searchParams.get("limit"), 10),
      100
    );

    const storeId = searchParams.get("storeId");
    const categoryId = searchParams.get("categoryId");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const codeType = searchParams.get("codeType");
    const discountType = searchParams.get("discountType");
    const countryCode = searchParams.get("countryCode");
    const isVerified = searchParams.get("isVerified");
    const isExclusive = searchParams.get("isExclusive");
    const isPinned = searchParams.get("isPinned");
    const search = searchParams.get("search");

    const query = {};

    // ========================================================
    // STORE FILTER
    // ========================================================

    if (
      storeId &&
      mongoose.Types.ObjectId.isValid(storeId)
    ) {
      query.storeId = storeId;
    }

    // ========================================================
    // CATEGORY FILTER
    // ========================================================

    if (
      categoryId &&
      mongoose.Types.ObjectId.isValid(categoryId)
    ) {
      query.categoryId = categoryId;
    }

    // ========================================================
    // STANDARD FILTERS
    // ========================================================

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    if (codeType) {
      query.codeType = codeType;
    }

    if (discountType) {
      query.discountType = discountType;
    }

    if (countryCode) {
      query.countryCode = countryCode.toUpperCase();
    }

    // ========================================================
    // BOOLEAN FILTERS
    // ========================================================

    if (isVerified === "true") {
      query.isVerified = true;
    }

    if (isVerified === "false") {
      query.isVerified = false;
    }

    if (isExclusive === "true") {
      query.isExclusive = true;
    }

    if (isExclusive === "false") {
      query.isExclusive = false;
    }

    if (isPinned === "true") {
      query.isPinned = true;
    }

    if (isPinned === "false") {
      query.isPinned = false;
    }

    // ========================================================
    // SEARCH
    // ========================================================

    if (search) {
      query.$or = [
        {
          title: {
            $regex: search,
            $options: "i",
          },
        },
        {
          subtitle: {
            $regex: search,
            $options: "i",
          },
        },
        {
          code: {
            $regex: search,
            $options: "i",
          },
        },
        {
          terms: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // ========================================================
    // PAGINATION
    // ========================================================

    const skip = (page - 1) * limit;

    // ========================================================
    // FETCH COUPONS
    // ========================================================

    const [coupons, total] = await Promise.all([
      Coupon.find(query)
        .populate("storeId", "name slug")
        .populate("categoryId", "name slug")
        .populate(
          "secondaryCategoryIds",
          "name slug"
        )
        .sort({
          isPinned: -1,
          sortOrder: 1,
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      Coupon.countDocuments(query),
    ]);

    // Preserve existing response structure.
    return NextResponse.json(
      {
        coupons,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET /admin/coupons Error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to fetch coupons.",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// POST /api/admin/coupons
// ============================================================
//
// Preserved:
// - All existing Coupon fields
// - Existing Mongoose validation
// - Existing response structure
//
// Added:
// - JWT authentication
// - Current employee authorization
// - Employee activity logging
// - Store name lookup for activity context
//
// ============================================================

export async function POST(req) {
  try {
    await connectDB();

    // ========================================================
    // AUTHENTICATE EMPLOYEE
    // ========================================================

    const auth = await getAuthenticatedCouponUser(req);

    if (auth.error) {
      return auth.error;
    }

    const authenticatedUser = auth.user;

    // ========================================================
    // NORMALIZE REQUEST BODY
    // ========================================================

    const body = await req.json();

    const payload = normalizeCouponPayload(body);

    // ========================================================
    // CREATE COUPON
    // ========================================================

    const coupon = await Coupon.create(payload);

    // ========================================================
    // RESOLVE STORE INFORMATION FOR ACTIVITY LOG
    // ========================================================
    //
    // Store lookup is optional activity context.
    // Coupon creation must not depend on it.
    //
    // ========================================================

    let storeName = "";

    try {
      if (
        coupon.storeId &&
        isValidObjectId(coupon.storeId)
      ) {
        const relatedStore = await Store.findById(
          coupon.storeId
        )
          .select("name slug")
          .lean();

        storeName = relatedStore?.name || "";
      }
    } catch (storeLookupError) {
      console.error(
        "Coupon created but store activity lookup failed:",
        storeLookupError
      );
    }

    // ========================================================
    // COUPON CREATED ACTIVITY
    // ========================================================
    //
    // The target name includes the Coupon title and,
    // when available, the related Store name.
    //
    // Coupon code is included as targetSlug for
    // identifying the created coupon in the dashboard.
    //
    // ========================================================

    await safelyRecordCouponActivity({
      actor: authenticatedUser,

      module: "coupon",
      action: "created",

      target: {
        _id: coupon._id,

        name: storeName
          ? `${coupon.title} — ${storeName}`
          : coupon.title || "Untitled Coupon",

        slug: coupon.code || "",

        url: coupon.trackingLink || "",
      },
    });

    // ========================================================
    // PRESERVE EXISTING RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        message: "Coupon created successfully.",
        coupon,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /admin/coupons Error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error.message ||
          "Failed to create coupon.",
      },
      { status: 400 }
    );
  }
}
