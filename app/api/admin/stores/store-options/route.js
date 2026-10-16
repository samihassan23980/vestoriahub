
/* ============================================================
   FILE: app/api/admin/stores/store-options/route.js

   PURPOSE:
   Lightweight, secure Store selector for Coupon Admin.

   FEATURES:
   - Signed JWT authentication
   - Current database user verification
   - Coupon and Store editor permissions
   - Minimal Store fields
   - Indexed slug-prefix search
   - Cursor pagination
   - Selected Store lookup by ID
   - No populate()
   - No countDocuments()
   - No skip()
   - No full Store documents
   - No public caching
   - Next.js 16 compatible
   ============================================================ */

import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/app/lib/mongodb";

import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSession,
} from "@/app/lib/authSession";

import Store from "@/app/models/store";
import User from "@/app/models/user";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ============================================================
// CONFIGURATION
// ============================================================

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 30;
const MAX_SEARCH_LENGTH = 80;

const ALLOWED_ROLES = new Set([
  "admin",
  "manager",
  "seo_manager",
  "content_manager",
  "coupon_editor",
  "store_editor",
]);

// Only fields required for Coupon Add/Edit/Manage.
//
// _id             -> Coupon.storeId
// name            -> Dropdown label
// slug            -> Store identification / cache revalidation
// primaryCategoryId -> Coupon.categoryId
// countryCode     -> Coupon country
// trackingLink    -> Coupon affiliate destination
// officialUrl     -> Fallback destination

const STORE_FIELDS = {
  _id: 1,
  name: 1,
  slug: 1,
  primaryCategoryId: 1,
  countryCode: 1,
  "tracking.trackingLink": 1,
  officialUrl: 1,
};

// ============================================================
// RESPONSE HELPERS
// ============================================================

function jsonError(message, status = 500) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store",
      },
    }
  );
}

function jsonSuccess(data) {
  return NextResponse.json(
    {
      success: true,
      ...data,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store",
      },
    }
  );
}

// ============================================================
// VALIDATION HELPERS
// ============================================================

function isValidObjectId(value) {
  return (
    typeof value === "string" &&
    /^[a-f0-9]{24}$/i.test(value) &&
    mongoose.Types.ObjectId.isValid(value)
  );
}

function parseLimit(value) {
  if (value === null || value === "") {
    return DEFAULT_LIMIT;
  }

  const number = Number(value);

  if (!Number.isSafeInteger(number) || number < 1) {
    return null;
  }

  return Math.min(number, MAX_LIMIT);
}

function escapeRegex(value) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function normalizeSearch(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFKC");
}

// ============================================================
// JWT AUTHENTICATION
// ============================================================

async function authenticateUser(req) {
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
    .select("_id role status")
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

  if (!ALLOWED_ROLES.has(user.role)) {
    return {
      error: jsonError(
        "You do not have permission to access store options.",
        403
      ),
    };
  }

  return { user };
}

// ============================================================
// STORE RESPONSE NORMALIZATION
// ============================================================

function formatStore(store) {
  const affiliateLink =
    store.tracking?.trackingLink || "";

  return {
    _id: String(store._id),

    name: store.name || "",

    slug: store.slug || "",

    primaryCategoryId: store.primaryCategoryId
      ? String(store.primaryCategoryId)
      : "",

    countryCode: store.countryCode || "GLOBAL",

    // One ready-to-use destination field.
    // Affiliate link takes priority over official URL.
    trackingLink:
      affiliateLink ||
      store.officialUrl ||
      "",
  };
}

// ============================================================
// CURSOR HELPERS
// ============================================================

function parseCursor(value) {
  if (!value) return null;

  if (!isValidObjectId(value)) {
    return "INVALID";
  }

  return new mongoose.Types.ObjectId(value);
}

// ============================================================
// GET /api/admin/stores/store-options
// ============================================================

export async function GET(req) {
  try {
    // --------------------------------------------------------
    // CONNECT DATABASE
    // --------------------------------------------------------

    await connectDB();

    // --------------------------------------------------------
    // VERIFY AUTHENTICATED EMPLOYEE
    // --------------------------------------------------------

    const auth = await authenticateUser(req);

    if (auth.error) {
      return auth.error;
    }

    // --------------------------------------------------------
    // READ QUERY PARAMETERS
    // --------------------------------------------------------

    const { searchParams } = new URL(req.url);

    const selectedId =
      searchParams.get("id")?.trim() || "";

    const rawSearch =
      searchParams.get("q") ??
      searchParams.get("search") ??
      "";

    const search = normalizeSearch(rawSearch);

    const limit = parseLimit(
      searchParams.get("limit")
    );

    const cursor = parseCursor(
      searchParams.get("cursor")
    );

    // --------------------------------------------------------
    // VALIDATE INPUTS
    // --------------------------------------------------------

    if (limit === null) {
      return jsonError(
        "limit must be a positive integer.",
        400
      );
    }

    if (search.length > MAX_SEARCH_LENGTH) {
      return jsonError(
        `Search must not exceed ${MAX_SEARCH_LENGTH} characters.`,
        400
      );
    }

    if (cursor === "INVALID") {
      return jsonError(
        "Invalid pagination cursor.",
        400
      );
    }

    // ========================================================
    // MODE 1: SELECTED STORE LOOKUP
    //
    // Important for Edit Coupon:
    // Fetch the selected Store directly by ObjectId.
    // ========================================================

    if (selectedId) {
      if (!isValidObjectId(selectedId)) {
        return jsonError(
          "Invalid store ID.",
          400
        );
      }

      const store = await Store.findById(
        selectedId,
        STORE_FIELDS
      ).lean();

      if (!store) {
        return jsonError(
          "Store not found.",
          404
        );
      }

      return jsonSuccess({
        store: formatStore(store),
      });
    }

    // ========================================================
    // MODE 2: SEARCH / INITIAL STORE LIST
    // ========================================================

    const query = {};

    // Cursor pagination without skip().
    if (cursor) {
      query._id = {
        $gt: cursor,
      };
    }

    // --------------------------------------------------------
    // INDEXED SLUG PREFIX SEARCH
    //
    // Example:
    // q=nike
    //
    // Matches:
    // nike
    // nike-us
    // nike-outlet
    //
    // Does not match:
    // best-nike-deals
    //
    // Existing unique slug index supports anchored
    // case-sensitive prefix regex queries.
    // --------------------------------------------------------

    if (search) {
      query.slug = {
        $regex: `^${escapeRegex(search)}`,
      };
    }

    // --------------------------------------------------------
    // MINIMAL DATABASE QUERY
    // --------------------------------------------------------

    const documents = await Store.find(
      query,
      STORE_FIELDS
    )
      .sort({ _id: 1 })
      .limit(limit + 1)
      .lean();

    // --------------------------------------------------------
    // CURSOR PAGINATION
    // --------------------------------------------------------

    const hasMore =
      documents.length > limit;

    const visibleDocuments = hasMore
      ? documents.slice(0, limit)
      : documents;

    const stores = visibleDocuments.map(
      formatStore
    );

    const lastStore =
      visibleDocuments[
        visibleDocuments.length - 1
      ];

    const nextCursor =
      hasMore && lastStore
        ? String(lastStore._id)
        : null;

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return jsonSuccess({
      stores,

      pagination: {
        limit,
        hasMore,
        nextCursor,
      },

      hasMore,
      nextCursor,
    });
  } catch (error) {
    console.error(
      "GET /api/admin/stores/store-options Error:",
      error
    );

    return jsonError(
      "Failed to load store options.",
      500
    );
  }
}
