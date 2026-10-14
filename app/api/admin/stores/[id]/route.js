
/* app/api/admin/stores/[id]/route.js */

import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/app/lib/mongodb";

import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSession,
} from "@/app/lib/authSession";

import Store from "@/app/models/store";
import Coupon from "@/app/models/coupon";
import Country from "@/app/models/country";
import AffiliateNetwork from "@/app/models/affiliateNetwork";
import Category from "@/app/models/category";
import User from "@/app/models/user";

import { recordActivity } from "@/app/lib/activityLogger";

// Never cache authenticated API responses.
export const dynamic = "force-dynamic";

// Same Store permissions as Admin Layout.
const STORE_ALLOWED_ROLES = new Set([
  "admin",
  "manager",
  "seo_manager",
  "content_manager",
  "store_editor",
]);

// ============================================================
// RESPONSE HELPERS
// ============================================================

function jsonError(message, status = 500, details = null) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details ? { details } : {}),
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

function normalizeNullableObjectId(value) {
  if (
    value === "" ||
    value === undefined ||
    value === null
  ) {
    return null;
  }

  return value;
}

// ============================================================
// SECURE JWT AUTHENTICATION
// ============================================================
//
// Never trust:
// - x-user-id request header
// - user_role cookie
// - request body createdBy/updatedBy
// - localStorage
//
// Only verified JWT and current database user determine
// employee identity and permissions.
//
// ============================================================

async function getAuthenticatedStoreUser(req) {
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

  // Fetch current user to detect disabled/deleted accounts
  // and changes to permissions.
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

  // Existing JWT role must match current database role.
  if (user.role !== session.role) {
    return {
      error: jsonError(
        "Your permissions have changed. Please sign in again.",
        401
      ),
    };
  }

  if (!STORE_ALLOWED_ROLES.has(user.role)) {
    return {
      error: jsonError(
        "You do not have permission to access stores.",
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
// STORE POPULATION
// ============================================================

function applyStorePopulates(query) {
  query
    .populate("primaryCategoryId", "_id name slug")
    .populate("subCategoryIds", "_id name slug")
    .populate("countryId", "_id name code status")
    .populate(
      "affiliateNetworkId",
      "_id name slug status"
    );

  if (mongoose.models.User) {
    query
      .populate("createdBy", "_id name email")
      .populate("updatedBy", "_id name email");
  }

  return query;
}

// ============================================================
// STORE UPDATE SANITIZATION
// All original fields and partial-update behavior preserved.
// ============================================================

function sanitizeStoreUpdatePayload(body = {}) {
  const payload = {};

  if ("name" in body) {
    payload.name = body.name;
  }

  if ("slug" in body) {
    payload.slug = body.slug;
  }

  if ("officialUrl" in body) {
    payload.officialUrl = body.officialUrl;
  }

  if ("countryId" in body) {
    payload.countryId = normalizeNullableObjectId(
      body.countryId
    );
  }

  if ("primaryCategoryId" in body) {
    payload.primaryCategoryId = normalizeNullableObjectId(
      body.primaryCategoryId
    );
  }

  if ("subCategoryIds" in body) {
    payload.subCategoryIds = Array.isArray(
      body.subCategoryIds
    )
      ? [
          ...new Set(
            body.subCategoryIds
              .map(String)
              .filter(isValidObjectId)
          ),
        ].slice(0, 10)
      : [];
  }

  if ("affiliateNetworkId" in body) {
    payload.affiliateNetworkId =
      normalizeNullableObjectId(
        body.affiliateNetworkId
      );
  }

  if ("tracking" in body) {
    payload.tracking = {
      trackingLink:
        body.tracking?.trackingLink || "",
      defaultSubid:
        body.tracking?.defaultSubid || "",
    };
  }

  if ("isActive" in body) {
    payload.isActive =
      typeof body.isActive === "boolean"
        ? body.isActive
        : Boolean(body.isActive);
  }

  if ("isFeatured" in body) {
    payload.isFeatured =
      typeof body.isFeatured === "boolean"
        ? body.isFeatured
        : Boolean(body.isFeatured);
  }

  if ("featuredOrder" in body) {
    payload.featuredOrder = Number.isFinite(
      Number(body.featuredOrder)
    )
      ? Number(body.featuredOrder)
      : 0;
  }

  if ("content" in body) {
    payload.content = {
      heading:
        body.content?.heading || "",
      shortDescription:
        body.content?.shortDescription || "",
      longDescription:
        body.content?.longDescription || "",
      whyShop:
        body.content?.whyShop || "",
    };
  }

  if ("policy" in body) {
    payload.policy = {
      shippingInfo:
        body.policy?.shippingInfo || "",
      returnRefundPolicy:
        body.policy?.returnRefundPolicy || "",
    };
  }

  if ("facts" in body) {
    payload.facts = {
      foundedYear:
        body.facts?.foundedYear === "" ||
        body.facts?.foundedYear === undefined ||
        body.facts?.foundedYear === null
          ? null
          : Number(body.facts.foundedYear),

      headquarters:
        body.facts?.headquarters || "",

      customerSupport:
        body.facts?.customerSupport || "",
    };
  }

  if ("images" in body) {
    payload.images = {
      logo: {
        url:
          body.images?.logo?.url || "",
        alt:
          body.images?.logo?.alt || "",
      },

      thumb: {
        url:
          body.images?.thumb?.url || "",
        alt:
          body.images?.thumb?.alt || "",
      },

      og: {
        url:
          body.images?.og?.url || "",
        alt:
          body.images?.og?.alt || "",
      },
    };
  }

  if ("seo" in body) {
    payload.seo = {
      metaTitle:
        body.seo?.metaTitle || "",

      metaDescription:
        body.seo?.metaDescription || "",

      canonicalUrl:
        body.seo?.canonicalUrl || "",

      indexable:
        typeof body.seo?.indexable === "boolean"
          ? body.seo.indexable
          : true,

      noFollow:
        typeof body.seo?.noFollow === "boolean"
          ? body.seo.noFollow
          : false,

      ogTitle:
        body.seo?.ogTitle || "",

      ogDescription:
        body.seo?.ogDescription || "",
    };
  }

  if ("faqs" in body) {
    payload.faqs = Array.isArray(body.faqs)
      ? body.faqs.slice(0, 20)
      : [];
  }

  return payload;
}

// ============================================================
// UPDATE VALIDATION
// Existing validation preserved.
// ============================================================

function validateUpdatePayload(payload) {
  const errors = [];

  if (
    "name" in payload &&
    !payload.name?.trim()
  ) {
    errors.push(
      "Store name is required."
    );
  }

  if (
    "slug" in payload &&
    !payload.slug?.trim()
  ) {
    errors.push(
      "Store slug is required."
    );
  }

  if (
    "officialUrl" in payload &&
    !payload.officialUrl?.trim()
  ) {
    errors.push(
      "Official URL is required."
    );
  }

  if (
    "primaryCategoryId" in payload &&
    (
      !payload.primaryCategoryId ||
      !isValidObjectId(
        payload.primaryCategoryId
      )
    )
  ) {
    errors.push(
      "primaryCategoryId must be a valid ObjectId."
    );
  }

  if (
    payload.countryId &&
    !isValidObjectId(payload.countryId)
  ) {
    errors.push(
      "countryId must be a valid ObjectId."
    );
  }

  if (
    payload.affiliateNetworkId &&
    !isValidObjectId(
      payload.affiliateNetworkId
    )
  ) {
    errors.push(
      "affiliateNetworkId must be a valid ObjectId."
    );
  }

  if (
    Array.isArray(payload.subCategoryIds) &&
    payload.subCategoryIds.some(
      (id) => !isValidObjectId(id)
    )
  ) {
    errors.push(
      "All subCategoryIds must be valid ObjectIds."
    );
  }

  return errors;
}

// ============================================================
// MONGODB ERROR HANDLING
// ============================================================

function handleMongoError(error) {
  if (
    error.code === 11000 &&
    error.keyPattern?.slug
  ) {
    return jsonError(
      "URL slug must be unique.",
      409
    );
  }

  if (error.name === "ValidationError") {
    const details = Object.values(
      error.errors
    ).map((err) => err.message);

    return jsonError(
      "Store validation failed.",
      400,
      details
    );
  }

  if (error.name === "CastError") {
    return jsonError(
      `Invalid ${error.path}: ${error.value}`,
      400
    );
  }

  return jsonError(
    error.message || "Internal server error.",
    500
  );
}

// ============================================================
// POPULATED STORE HELPER
// ============================================================

async function getPopulatedStore(storeId) {
  return applyStorePopulates(
    Store.findById(storeId)
  ).lean();
}

// ============================================================
// ACTIVITY LOGGING HELPER
// ============================================================
//
// Logging failures are isolated from Store mutations.
//
// This is best-effort logging: Store operations remain
// successful even when ActivityLog cannot be written.
//
// ============================================================

async function safelyRecordStoreActivity(options) {
  try {
    await recordActivity(options);
  } catch (error) {
    console.error(
      "Store activity logging failed:",
      error
    );
  }
}

// ============================================================
// GET /api/admin/stores/[id]
// Existing response preserved.
// ============================================================

export async function GET(req, { params }) {
  try {
    await connectDB();

    // Secure authentication and Store role check.
    const auth = await getAuthenticatedStoreUser(req);

    if (auth.error) {
      return auth.error;
    }

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return jsonError(
        "Invalid store ID.",
        400
      );
    }

    const store = await getPopulatedStore(id);

    if (!store) {
      return jsonError(
        "Store not found.",
        404
      );
    }

    return jsonSuccess({
      store,
    });
  } catch (error) {
    console.error(
      "GET /api/admin/stores/[id] Error:",
      error
    );

    return handleMongoError(error);
  }
}

// ============================================================
// PUT /api/admin/stores/[id]
// Partial update preserved.
// updatedBy comes from verified JWT.
// Activity records only permitted old/new values.
// ============================================================

export async function PUT(req, { params }) {
  try {
    await connectDB();

    // Verify logged-in employee and permissions.
    const auth = await getAuthenticatedStoreUser(req);

    if (auth.error) {
      return auth.error;
    }

    const authenticatedUser = auth.user;

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return jsonError(
        "Invalid store ID.",
        400
      );
    }

    const body = await req.json();

    const payload =
      sanitizeStoreUpdatePayload(body);

    const errors =
      validateUpdatePayload(payload);

    if (errors.length > 0) {
      return jsonError(
        "Invalid store payload.",
        400,
        errors
      );
    }

    const store = await Store.findById(id);

    if (!store) {
      return jsonError(
        "Store not found.",
        404
      );
    }

    // ========================================================
    // CAPTURE PREVIOUS STORE VALUES
    // ========================================================
    //
    // Only the agreed audit fields are captured.
    //
    // Never store descriptions, SEO content, policy, images,
    // FAQs, or other private Store content in activity logs.
    //
    // ========================================================

    const beforeSnapshot = {
      officialUrl: store.officialUrl || "",

      tracking: {
        trackingLink:
          store.tracking?.trackingLink || "",
      },
    };

    // Apply only submitted fields.
    // Existing fields not included in payload remain intact.
    Object.entries(payload).forEach(
      ([key, value]) => {
        store.set(key, value);
      }
    );

    // Trusted employee identity.
    // Never accept updatedBy from request body or header.
    store.updatedBy = authenticatedUser._id;

    await store.save();

    // ========================================================
    // CAPTURE SAVED VALUES
    // ========================================================

    const afterSnapshot = {
      officialUrl: store.officialUrl || "",

      tracking: {
        trackingLink:
          store.tracking?.trackingLink || "",
      },
    };

    // ========================================================
    // STORE UPDATE ACTIVITY LOG
    // ========================================================
    //
    // The activityLogger helper records old/new values only
    // for:
    //
    // - officialUrl
    // - tracking.trackingLink
    //
    // Other Store updates still generate a generic
    // "updated" event without content diffs.
    //
    // ========================================================

    await safelyRecordStoreActivity({
      actor: authenticatedUser,

      module: "store",
      action: "updated",

      target: {
        _id: store._id,
        name: store.name,
        slug: store.slug,
        url: store.officialUrl,
      },

      before: beforeSnapshot,
      after: afterSnapshot,
    });

    // Preserve existing populated response.
    const populatedStore =
      await getPopulatedStore(store._id);

    return jsonSuccess({
      message:
        "Store updated successfully.",
      store: populatedStore,
    });
  } catch (error) {
    console.error(
      "PUT /api/admin/stores/[id] Error:",
      error
    );

    return handleMongoError(error);
  }
}

// ============================================================
// DELETE /api/admin/stores/[id]
// Coupon protection and response preserved.
// Deleted Store identity survives in ActivityLog snapshot.
// ============================================================

export async function DELETE(req, { params }) {
  try {
    await connectDB();

    // Verify logged-in employee and permissions.
    const auth = await getAuthenticatedStoreUser(req);

    if (auth.error) {
      return auth.error;
    }

    const authenticatedUser = auth.user;

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return jsonError(
        "Invalid store ID.",
        400
      );
    }

    const store = await Store.findById(id);

    if (!store) {
      return jsonError(
        "Store not found.",
        404
      );
    }

    // Preserve existing coupon deletion restriction.
    const hasCoupons = await Coupon.exists({
      storeId: id,
    });

    if (hasCoupons) {
      return jsonError(
        "Cannot delete store because it has associated coupons. Delete or reassign coupons first, or set the store to inactive.",
        400
      );
    }

    // ========================================================
    // SNAPSHOT BEFORE DELETION
    // ========================================================
    //
    // Activity logs retain the deleted Store name and slug.
    //
    // ========================================================

    const deletedStoreSnapshot = {
      _id: store._id,
      name: store.name,
      slug: store.slug,
      url: store.officialUrl,
    };

    // ========================================================
    // DELETE STORE
    // ========================================================

    await Store.findByIdAndDelete(id);

    // ========================================================
    // STORE DELETE ACTIVITY LOG
    // ========================================================

    await safelyRecordStoreActivity({
      actor: authenticatedUser,

      module: "store",
      action: "deleted",

      target: deletedStoreSnapshot,
    });

    return jsonSuccess({
      message:
        "Store deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE /api/admin/stores/[id] Error:",
      error
    );

    return handleMongoError(error);
  }
}
