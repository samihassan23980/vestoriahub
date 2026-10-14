
/* app/api/admin/stores/route.js */

import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/app/lib/mongodb";

import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSession,
} from "@/app/lib/authSession";

import Store from "@/app/models/store";
import Category from "@/app/models/category";
import Country from "@/app/models/country";
import AffiliateNetwork from "@/app/models/affiliateNetwork";
import User from "@/app/models/user";

import { recordActivity } from "@/app/lib/activityLogger";

// Authentication responses must not be cached.
export const dynamic = "force-dynamic";

// Same permissions as existing Admin Layout's Stores section.
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

function parsePositiveInt(value, fallback, max = 100) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, max);
}

function normalizeBooleanParam(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return undefined;
  }

  if (value === "true") return true;
  if (value === "false") return false;

  return "INVALID";
}

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

function isHttpUrl(value) {
  if (!value) return true;

  try {
    const url = new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

// ============================================================
// SECURE AUTHENTICATION & AUTHORIZATION
// ============================================================
//
// Never trust x-user-id, user_role, request body user IDs,
// or localStorage for authentication.
//
// The session identity and role come from a verified JWT.
// The database is checked for current user status and role.
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

  // Check current database user to support role changes,
  // disabled accounts, and deleted accounts.
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

  // A role change invalidates the previous signed role.
  // User must sign in again to obtain the new role.
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

function applyStorePopulates(
  query,
  { includeAudit = true } = {}
) {
  query
    .populate("primaryCategoryId", "name slug")
    .populate("subCategoryIds", "name slug")
    .populate("countryId", "name code status")
    .populate(
      "affiliateNetworkId",
      "name slug status"
    );

  if (includeAudit && mongoose.models.User) {
    query
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");
  }

  return query;
}

// ============================================================
// STORE PAYLOAD SANITIZATION
// Existing fields and defaults preserved.
// ============================================================

function sanitizeStorePayload(body = {}) {
  return {
    name: body.name || "",
    slug: body.slug || "",
    officialUrl: body.officialUrl || "",

    countryId: normalizeNullableObjectId(
      body.countryId
    ),

    primaryCategoryId: body.primaryCategoryId,

    subCategoryIds: Array.isArray(body.subCategoryIds)
      ? [
          ...new Set(
            body.subCategoryIds.filter(Boolean)
          ),
        ].slice(0, 10)
      : [],

    affiliateNetworkId: normalizeNullableObjectId(
      body.affiliateNetworkId
    ),

    tracking: {
      trackingLink:
        body.tracking?.trackingLink || "",
      defaultSubid:
        body.tracking?.defaultSubid || "",
    },

    isActive:
      typeof body.isActive === "boolean"
        ? body.isActive
        : true,

    isFeatured:
      typeof body.isFeatured === "boolean"
        ? body.isFeatured
        : false,

    featuredOrder: Number.isFinite(
      Number(body.featuredOrder)
    )
      ? Number(body.featuredOrder)
      : 0,

    content: {
      heading: body.content?.heading || "",
      shortDescription:
        body.content?.shortDescription || "",
      longDescription:
        body.content?.longDescription || "",
      whyShop: body.content?.whyShop || "",
    },

    policy: {
      shippingInfo:
        body.policy?.shippingInfo || "",
      returnRefundPolicy:
        body.policy?.returnRefundPolicy || "",
    },

    facts: {
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
    },

    images: {
      logo: {
        url: body.images?.logo?.url || "",
        alt: body.images?.logo?.alt || "",
      },

      thumb: {
        url: body.images?.thumb?.url || "",
        alt: body.images?.thumb?.alt || "",
      },

      og: {
        url: body.images?.og?.url || "",
        alt: body.images?.og?.alt || "",
      },
    },

    seo: {
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
    },

    faqs: Array.isArray(body.faqs)
      ? body.faqs.slice(0, 20)
      : [],
  };
}

// ============================================================
// STORE VALIDATION
// Original validation rules preserved.
// ============================================================

function validateRequiredPayload(payload) {
  const errors = [];
  const currentYear = new Date().getFullYear();

  if (!payload.name?.trim()) {
    errors.push("Store name is required.");
  }

  if (!payload.slug?.trim()) {
    errors.push("Store slug is required.");
  }

  if (!payload.officialUrl?.trim()) {
    errors.push("Official URL is required.");
  } else if (!isHttpUrl(payload.officialUrl)) {
    errors.push(
      "officialUrl must be a valid http/https URL."
    );
  }

  if (!payload.primaryCategoryId) {
    errors.push(
      "Primary category is required."
    );
  }

  if (
    payload.primaryCategoryId &&
    !isValidObjectId(
      payload.primaryCategoryId
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

  if (
    payload.tracking?.trackingLink &&
    !isHttpUrl(
      payload.tracking.trackingLink
    )
  ) {
    errors.push(
      "tracking.trackingLink must be a valid http/https URL."
    );
  }

  if (
    payload.seo?.canonicalUrl &&
    !isHttpUrl(payload.seo.canonicalUrl)
  ) {
    errors.push(
      "seo.canonicalUrl must be a valid http/https URL."
    );
  }

  if (
    payload.images?.logo?.url &&
    !isHttpUrl(payload.images.logo.url)
  ) {
    errors.push(
      "images.logo.url must be a valid http/https URL."
    );
  }

  if (
    payload.images?.thumb?.url &&
    !isHttpUrl(payload.images.thumb.url)
  ) {
    errors.push(
      "images.thumb.url must be a valid http/https URL."
    );
  }

  if (
    payload.images?.og?.url &&
    !isHttpUrl(payload.images.og.url)
  ) {
    errors.push(
      "images.og.url must be a valid http/https URL."
    );
  }

  if (
    payload.facts?.foundedYear !== null &&
    payload.facts?.foundedYear !== undefined
  ) {
    if (
      !Number.isFinite(
        Number(payload.facts.foundedYear)
      )
    ) {
      errors.push(
        "facts.foundedYear must be a valid number."
      );
    } else if (
      Number(payload.facts.foundedYear) < 1800 ||
      Number(payload.facts.foundedYear) > currentYear
    ) {
      errors.push(
        `facts.foundedYear must be between 1800 and ${currentYear}.`
      );
    }
  }

  if (payload.faqs?.length > 20) {
    errors.push(
      "faqs cannot exceed 20 items."
    );
  }

  payload.faqs?.forEach((faq, index) => {
    if (!faq.question?.trim()) {
      errors.push(
        `FAQ ${index + 1}: question is required.`
      );
    }

    if (!faq.answer?.trim()) {
      errors.push(
        `FAQ ${index + 1}: answer is required.`
      );
    }
  });

  return errors;
}

// ============================================================
// DATABASE ERROR HANDLING
// ============================================================

function handleMongoError(error) {
  if (
    error.code === 11000 &&
    error.keyPattern?.slug
  ) {
    return jsonError(
      "A store with this URL slug already exists.",
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
// GET /api/admin/stores
// Search, filters, sorting, pagination and population preserved.
// ============================================================

export async function GET(req) {
  try {
    await connectDB();

    // Verify actual logged-in user.
    const auth = await getAuthenticatedStoreUser(req);

    if (auth.error) {
      return auth.error;
    }

    const { searchParams } = new URL(req.url);

    const page = parsePositiveInt(
      searchParams.get("page"),
      1
    );

    const limit = parsePositiveInt(
      searchParams.get("limit"),
      10,
      100
    );

    const search =
      searchParams.get("search")?.trim() || "";

    const isActiveParam =
      normalizeBooleanParam(
        searchParams.get("isActive")
      );

    const isFeaturedParam =
      normalizeBooleanParam(
        searchParams.get("isFeatured")
      );

    if (isActiveParam === "INVALID") {
      return jsonError(
        "isActive must be either true or false.",
        400
      );
    }

    if (isFeaturedParam === "INVALID") {
      return jsonError(
        "isFeatured must be either true or false.",
        400
      );
    }

    const query = {};

    if (
      typeof isActiveParam === "boolean"
    ) {
      query.isActive = isActiveParam;
    }

    if (
      typeof isFeaturedParam === "boolean"
    ) {
      query.isFeatured = isFeaturedParam;
    }

    const countryId =
      searchParams.get("countryId");

    if (countryId) {
      if (!isValidObjectId(countryId)) {
        return jsonError(
          "countryId must be a valid ObjectId.",
          400
        );
      }

      query.countryId = countryId;
    }

    const primaryCategoryId =
      searchParams.get("primaryCategoryId");

    if (primaryCategoryId) {
      if (!isValidObjectId(primaryCategoryId)) {
        return jsonError(
          "primaryCategoryId must be a valid ObjectId.",
          400
        );
      }

      query.primaryCategoryId =
        primaryCategoryId;
    }

    const affiliateNetworkId =
      searchParams.get("affiliateNetworkId");

    if (affiliateNetworkId) {
      if (!isValidObjectId(affiliateNetworkId)) {
        return jsonError(
          "affiliateNetworkId must be a valid ObjectId.",
          400
        );
      }

      query.affiliateNetworkId =
        affiliateNetworkId;
    }

    if (search) {
      query.$text = {
        $search: search,
      };
    }

    const projection = search
      ? {
          score: {
            $meta: "textScore",
          },
        }
      : {};

    const sort = search
      ? {
          score: {
            $meta: "textScore",
          },
        }
      : {
          createdAt: -1,
        };

    const skip = (page - 1) * limit;

    const storesQuery = applyStorePopulates(
      Store.find(query, projection)
        .sort(sort)
        .skip(skip)
        .limit(limit),
      {
        includeAudit: true,
      }
    );

    const [stores, total] = await Promise.all([
      storesQuery.lean(),
      Store.countDocuments(query),
    ]);

    return jsonSuccess({
      stores,

      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error(
      "GET /api/admin/stores Error:",
      error
    );

    return handleMongoError(error);
  }
}

// ============================================================
// POST /api/admin/stores
// Existing store creation preserved.
// Employee identity now comes from verified session.
// ============================================================

export async function POST(req) {
  try {
    await connectDB();

    // Verify user and role before accepting the payload.
    const auth = await getAuthenticatedStoreUser(req);

    if (auth.error) {
      return auth.error;
    }

    const authenticatedUser = auth.user;

    const body = await req.json();

    // Existing sanitization and validation preserved.
    const payload = sanitizeStorePayload(body);

    const errors = validateRequiredPayload(payload);

    if (errors.length > 0) {
      return jsonError(
        "Invalid store payload.",
        400,
        errors
      );
    }

    // The authenticated user is always the creator.
    // Ignore client-supplied createdBy/updatedBy/x-user-id.
    const newStore = new Store({
      ...payload,

      createdBy: authenticatedUser._id,
      updatedBy: authenticatedUser._id,
    });

    await newStore.save();

    // ========================================================
    // STORE CREATE ACTIVITY LOG
    // ========================================================
    // Record the authenticated employee snapshot.
    // Store creation must remain successful even if logging
    // encounters an error.
    // ========================================================

    try {
      await recordActivity({
        actor: authenticatedUser,

        module: "store",
        action: "created",

        target: {
          _id: newStore._id,
          name: newStore.name,
          slug: newStore.slug,
          url: newStore.officialUrl,
        },
      });
    } catch (activityError) {
      console.error(
        "Store created but activity logging failed:",
        activityError
      );
    }

    // Preserve existing populated response.
    const populatedStoreQuery = applyStorePopulates(
      Store.findById(newStore._id),
      {
        includeAudit: true,
      }
    );

    const populatedStore =
      await populatedStoreQuery.lean();

    return jsonSuccess(
      {
        message: "Store created successfully.",
        store: populatedStore,
      },
      201
    );
  } catch (error) {
    console.error(
      "POST /api/admin/stores Error:",
      error
    );

    return handleMongoError(error);
  }
}
