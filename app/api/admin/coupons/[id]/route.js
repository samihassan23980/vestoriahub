/* app/api/admin/coupons/[id]/route.js */

import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import mongoose from "mongoose";

import { connectDB } from "@/app/lib/mongodb";

import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSession,
} from "@/app/lib/authSession";

import { recordActivity } from "@/app/lib/activityLogger";

import Coupon from "@/app/models/coupon";
import Store from "@/app/models/store";
import Category from "@/app/models/category";
import User from "@/app/models/user";

export const dynamic = "force-dynamic";

// ============================================================
// COUPON PERMISSIONS
// ============================================================
//
// Keep consistent with:
// app/api/admin/coupons/route.js
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
// RESPONSE HELPERS
// ============================================================

function jsonError(message, status = 500) {
  return NextResponse.json(
    {
      error: message,
    },
    { status },
  );
}

function jsonSuccess(data, status = 200) {
  return NextResponse.json(data, { status });
}

// ============================================================
// COMMON HELPERS
// ============================================================

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// ============================================================
// SECURE JWT AUTHENTICATION
// ============================================================
//
// Never trust:
// - x-user-id headers
// - user_role cookies
// - request body user IDs
// - localStorage
//
// Only verified JWT + current database user are trusted.
//
// ============================================================

async function getAuthenticatedCouponUser(req) {
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) {
    return {
      error: jsonError("Authentication required. Please sign in.", 401),
    };
  }

  const session = await verifyAdminSession(token);

  if (!session || !session.userId || !isValidObjectId(session.userId)) {
    return {
      error: jsonError(
        "Invalid or expired session. Please sign in again.",
        401,
      ),
    };
  }

  const user = await User.findById(session.userId)
    .select("_id name email role status")
    .lean();

  if (!user) {
    return {
      error: jsonError("Your account no longer exists.", 401),
    };
  }

  if (user.status === "disabled") {
    return {
      error: jsonError("Your account has been deactivated.", 403),
    };
  }

  if (user.role !== session.role) {
    return {
      error: jsonError(
        "Your permissions have changed. Please sign in again.",
        401,
      ),
    };
  }

  if (!COUPON_ALLOWED_ROLES.has(user.role)) {
    return {
      error: jsonError("You do not have permission to access coupons.", 403),
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
  return {
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
      body.maxDiscountCap === "" || body.maxDiscountCap == null
        ? null
        : Number(body.maxDiscountCap),

    minOrderValue: Number(body.minOrderValue ?? 0),

    expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,

    status: body.status || "active",

    isVerified: Boolean(body.isVerified),

    verifiedAt: body.isVerified
      ? body.verifiedAt
        ? new Date(body.verifiedAt)
        : undefined
      : null,

    isExclusive: Boolean(body.isExclusive),

    countryCode: body.countryCode || "GLOBAL",

    sortOrder:
      body.sortOrder === "" || body.sortOrder == null
        ? 1000
        : Number(body.sortOrder),

    isPinned: Boolean(body.isPinned),

    storeId: body.storeId,
    categoryId: body.categoryId,

    secondaryCategoryIds: Array.isArray(body.secondaryCategoryIds)
      ? body.secondaryCategoryIds.filter(Boolean)
      : [],
  };
}

// ============================================================
// COUPON POPULATION
// ============================================================

function applyCouponPopulates(query) {
  return query
    .populate("storeId", "name slug")
    .populate("categoryId", "name slug")
    .populate("secondaryCategoryIds", "name slug");
}

// ============================================================
// ACTIVITY LOGGER
// ============================================================
//
// Logging failure must not undo a successful database write.
//
// ============================================================

async function safelyRecordCouponActivity(options) {
  try {
    await recordActivity(options);
  } catch (error) {
    console.error("Coupon activity logging failed:", error);
  }
}

// ============================================================
// CACHE REVALIDATION
// ============================================================
//
// Next.js 16 requires a cache-life profile as the
// second argument for revalidateTag.
//
// "max" uses stale-while-revalidate behavior.
//
// ============================================================

function safelyRevalidateCouponTags(storeSlugs = []) {
  const tags = new Set(["stores"]);

  for (const slug of storeSlugs) {
    if (slug) {
      tags.add(`store-${slug}`);
    }
  }

  for (const tag of tags) {
    try {
      revalidateTag(tag, "max");
    } catch (error) {
      console.error(`Failed to revalidate cache tag "${tag}":`, error);
    }
  }
}

// ============================================================
// GET /api/admin/coupons/[id]
// ============================================================

export async function GET(req, { params }) {
  try {
    await connectDB();

    // ========================================================
    // AUTHENTICATION
    // ========================================================

    const auth = await getAuthenticatedCouponUser(req);

    if (auth.error) {
      return auth.error;
    }

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return jsonError("Invalid coupon ID.", 400);
    }

    // ========================================================
    // FETCH COUPON
    // ========================================================

    const coupon = await applyCouponPopulates(Coupon.findById(id)).lean();

    if (!coupon) {
      return jsonError("Coupon not found.", 404);
    }

    return jsonSuccess(
      {
        coupon,
      },
      200,
    );
  } catch (error) {
    console.error("GET /admin/coupons/[id] Error:", error);

    return jsonError("Failed to fetch coupon.", 500);
  }
}

// ============================================================
// PUT /api/admin/coupons/[id]
// ============================================================
//
// Existing behavior:
// - Normalize all Coupon fields
// - Update document
// - Save
// - Populate response
// - Revalidate public Store cache
//
// Added:
// - JWT authentication
// - Employee identity
// - Activity log
// - Old/new Coupon code and trackingLink
// - Previous and new Store cache invalidation
//
// ============================================================

export async function PUT(req, { params }) {
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
    // VALIDATE COUPON ID
    // ========================================================

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return jsonError("Invalid coupon ID.", 400);
    }

    // ========================================================
    // REQUEST PAYLOAD
    // ========================================================

    const body = await req.json();
    const payload = normalizeCouponPayload(body);

    // ========================================================
    // FETCH EXISTING COUPON
    // ========================================================

    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return jsonError("Coupon not found.", 404);
    }

    // ========================================================
    // SNAPSHOT BEFORE UPDATE
    // ========================================================
    //
    // Only agreed fields are recorded for old/new comparison.
    //
    // ========================================================

    const beforeSnapshot = {
      code: coupon.code || "",
      trackingLink: coupon.trackingLink || "",
    };

    const previousStoreId = coupon.storeId ? String(coupon.storeId) : null;

    // ========================================================
    // APPLY ORIGINAL UPDATE BEHAVIOR
    // ========================================================

    Object.assign(coupon, payload);

    await coupon.save();

    // ========================================================
    // FETCH UPDATED POPULATED COUPON
    // ========================================================

    const updatedCoupon = await applyCouponPopulates(
      Coupon.findById(id),
    ).lean();

    // ========================================================
    // SNAPSHOT AFTER UPDATE
    // ========================================================

    const afterSnapshot = {
      code: coupon.code || "",
      trackingLink: coupon.trackingLink || "",
    };

    // ========================================================
    // ACTIVITY LOG: COUPON UPDATED
    // ========================================================
    //
    // recordActivity/buildActivityChanges compares:
    //
    // - code
    // - trackingLink
    //
    // Other Coupon fields are not stored as old/new values.
    //
    // ========================================================

    await safelyRecordCouponActivity({
      actor: authenticatedUser,

      module: "coupon",
      action: "updated",

      target: {
        _id: coupon._id,
        name: updatedCoupon?.title || coupon.title || "Untitled Coupon",
        slug: coupon.code || "",
        url: coupon.trackingLink || "",
      },

      before: beforeSnapshot,
      after: afterSnapshot,
    });

    // ========================================================
    // RESOLVE PREVIOUS STORE SLUG
    // ========================================================
    //
    // If the Coupon was moved to another Store, both Store
    // cache tags must be invalidated.
    //
    // ========================================================

    const storeSlugs = [];

    if (updatedCoupon?.storeId?.slug) {
      storeSlugs.push(updatedCoupon.storeId.slug);
    }

    const currentStoreId = coupon.storeId ? String(coupon.storeId) : null;

    if (previousStoreId && previousStoreId !== currentStoreId) {
      try {
        const previousStore = await Store.findById(previousStoreId)
          .select("slug")
          .lean();

        if (previousStore?.slug) {
          storeSlugs.push(previousStore.slug);
        }
      } catch (lookupError) {
        console.error("Previous Store slug lookup failed:", lookupError);
      }
    }

    // ========================================================
    // CACHE REVALIDATION
    // ========================================================

    safelyRevalidateCouponTags(storeSlugs);

    // ========================================================
    // PRESERVE EXISTING RESPONSE
    // ========================================================

    return jsonSuccess(
      {
        message: "Coupon updated successfully.",
        coupon: updatedCoupon,
      },
      200,
    );
  } catch (error) {
    console.error("PUT /admin/coupons/[id] Error:", error);

    return jsonError(error.message || "Failed to update coupon.", 400);
  }
}

// ============================================================
// DELETE /api/admin/coupons/[id]
// ============================================================
//
// Existing behavior:
// - Delete Coupon
// - Revalidate Store cache
// - Preserve response
//
// Added:
// - JWT authentication
// - Employee activity logging
// - Deleted Coupon identity snapshot
//
// ============================================================

export async function DELETE(req, { params }) {
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
    // VALIDATE COUPON ID
    // ========================================================

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return jsonError("Invalid coupon ID.", 400);
    }

    // ========================================================
    // DELETE COUPON AND POPULATE STORE
    // ========================================================

    const deletedCoupon = await Coupon.findByIdAndDelete(id).populate(
      "storeId",
      "name slug",
    );

    if (!deletedCoupon) {
      return jsonError("Coupon not found.", 404);
    }

    // ========================================================
    // ACTIVITY LOG: COUPON DELETED
    // ========================================================
    //
    // Save identity snapshot after successful deletion.
    //
    // ========================================================

    await safelyRecordCouponActivity({
      actor: authenticatedUser,

      module: "coupon",
      action: "deleted",

      target: {
        _id: deletedCoupon._id,

        name: deletedCoupon.title || "Untitled Coupon",

        slug: deletedCoupon.code || "",

        url: deletedCoupon.trackingLink || "",
      },
    });

    // ========================================================
    // CACHE REVALIDATION
    // ========================================================

    safelyRevalidateCouponTags([deletedCoupon.storeId?.slug]);

    // ========================================================
    // PRESERVE EXISTING RESPONSE
    // ========================================================

    return jsonSuccess(
      {
        message: "Coupon deleted successfully.",
      },
      200,
    );
  } catch (error) {
    console.error("DELETE /admin/coupons/[id] Error:", error);

    return jsonError("Failed to delete coupon.", 500);
  }
}
