/* /app/api/admin/stores/[id]/route.js */

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/app/lib/mongodb";
import Store from "@/app/models/store";
import Coupon from "@/app/models/coupon";

function jsonError(message, status = 500, details = null) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details ? { details } : {}),
    },
    { status },
  );
}

function jsonSuccess(data, status = 200) {
  return NextResponse.json(
    {
      success: true,
      ...data,
    },
    { status },
  );
}

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function normalizeNullableObjectId(value) {
  if (value === "" || value === undefined || value === null) return null;
  return value;
}

function getOptionalAuditUserId(req) {
  const userId = req.headers.get("x-user-id")?.trim();

  if (!userId) return null;
  if (!isValidObjectId(userId)) return null;

  return userId;
}

function applyStorePopulates(query) {
  query
    .populate("primaryCategoryId", "name slug")
    .populate("subCategoryIds", "name slug")
    .populate("countryId", "name code status")
    .populate("affiliateNetworkId", "name slug status");

  if (mongoose.models.User) {
    query
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");
  }

  return query;
}

function sanitizeStoreUpdatePayload(body = {}) {
  const payload = {};

  if ("name" in body) payload.name = body.name;
  if ("slug" in body) payload.slug = body.slug;
  if ("officialUrl" in body) payload.officialUrl = body.officialUrl;

  if ("countryId" in body) {
    payload.countryId = normalizeNullableObjectId(body.countryId);
  }

  if ("primaryCategoryId" in body) {
    payload.primaryCategoryId = body.primaryCategoryId;
  }

  if ("subCategoryIds" in body) {
    payload.subCategoryIds = Array.isArray(body.subCategoryIds)
      ? [...new Set(body.subCategoryIds.filter(Boolean))].slice(0, 10)
      : [];
  }

  if ("affiliateNetworkId" in body) {
    payload.affiliateNetworkId = normalizeNullableObjectId(
      body.affiliateNetworkId,
    );
  }

  if ("tracking" in body) {
    payload.tracking = {
      trackingLink: body.tracking?.trackingLink || "",
      defaultSubid: body.tracking?.defaultSubid || "",
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
    payload.featuredOrder = Number.isFinite(Number(body.featuredOrder))
      ? Number(body.featuredOrder)
      : 0;
  }

  if ("content" in body) {
    payload.content = {
      heading: body.content?.heading || "",
      shortDescription: body.content?.shortDescription || "",
      longDescription: body.content?.longDescription || "",
      whyShop: body.content?.whyShop || "",
    };
  }

  if ("policy" in body) {
    payload.policy = {
      shippingInfo: body.policy?.shippingInfo || "",
      returnRefundPolicy: body.policy?.returnRefundPolicy || "",
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
      headquarters: body.facts?.headquarters || "",
      customerSupport: body.facts?.customerSupport || "",
    };
  }

  if ("images" in body) {
    payload.images = {
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
    };
  }

  if ("seo" in body) {
    payload.seo = {
      metaTitle: body.seo?.metaTitle || "",
      metaDescription: body.seo?.metaDescription || "",
      canonicalUrl: body.seo?.canonicalUrl || "",
      indexable:
        typeof body.seo?.indexable === "boolean" ? body.seo.indexable : true,
      noFollow:
        typeof body.seo?.noFollow === "boolean" ? body.seo.noFollow : false,
      ogTitle: body.seo?.ogTitle || "",
      ogDescription: body.seo?.ogDescription || "",
    };
  }

  if ("faqs" in body) {
    payload.faqs = Array.isArray(body.faqs) ? body.faqs.slice(0, 20) : [];
  }

  return payload;
}

function validateUpdatePayload(payload) {
  const errors = [];

  if ("name" in payload && !payload.name?.trim()) {
    errors.push("Store name is required.");
  }

  if ("slug" in payload && !payload.slug?.trim()) {
    errors.push("Store slug is required.");
  }

  if ("officialUrl" in payload && !payload.officialUrl?.trim()) {
    errors.push("Official URL is required.");
  }

  if (
    "primaryCategoryId" in payload &&
    (!payload.primaryCategoryId || !isValidObjectId(payload.primaryCategoryId))
  ) {
    errors.push("primaryCategoryId must be a valid ObjectId.");
  }

  if (payload.countryId && !isValidObjectId(payload.countryId)) {
    errors.push("countryId must be a valid ObjectId.");
  }

  if (
    payload.affiliateNetworkId &&
    !isValidObjectId(payload.affiliateNetworkId)
  ) {
    errors.push("affiliateNetworkId must be a valid ObjectId.");
  }

  if (
    Array.isArray(payload.subCategoryIds) &&
    payload.subCategoryIds.some((id) => !isValidObjectId(id))
  ) {
    errors.push("All subCategoryIds must be valid ObjectIds.");
  }

  return errors;
}

function handleMongoError(error) {
  if (error.code === 11000 && error.keyPattern?.slug) {
    return jsonError("URL slug must be unique.", 409);
  }

  if (error.name === "ValidationError") {
    const details = Object.values(error.errors).map((err) => err.message);
    return jsonError("Store validation failed.", 400, details);
  }

  if (error.name === "CastError") {
    return jsonError(`Invalid ${error.path}: ${error.value}`, 400);
  }

  return jsonError(error.message || "Internal server error.", 500);
}

async function getPopulatedStore(storeId) {
  return applyStorePopulates(Store.findById(storeId)).lean();
}

export async function GET(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return jsonError("Invalid store ID.", 400);
    }

    const store = await getPopulatedStore(id);

    if (!store) {
      return jsonError("Store not found.", 404);
    }

    return jsonSuccess({ store });
  } catch (error) {
    console.error("GET /api/admin/stores/[id] Error:", error);
    return handleMongoError(error);
  }
}

export async function PUT(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return jsonError("Invalid store ID.", 400);
    }

    const auditUserId = getOptionalAuditUserId(req);

    const body = await req.json();
    const payload = sanitizeStoreUpdatePayload(body);
    const errors = validateUpdatePayload(payload);

    if (errors.length > 0) {
      return jsonError("Invalid store payload.", 400, errors);
    }

    const store = await Store.findById(id);

    if (!store) {
      return jsonError("Store not found.", 404);
    }

    Object.entries(payload).forEach(([key, value]) => {
      store.set(key, value);
    });

    if (auditUserId) {
      store.updatedBy = auditUserId;
    }

    await store.save();

    const populatedStore = await getPopulatedStore(store._id);

    return jsonSuccess({
      message: "Store updated successfully.",
      store: populatedStore,
    });
  } catch (error) {
    console.error("PUT /api/admin/stores/[id] Error:", error);
    return handleMongoError(error);
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return jsonError("Invalid store ID.", 400);
    }

    const store = await Store.findById(id);

    if (!store) {
      return jsonError("Store not found.", 404);
    }

    const hasCoupons = await Coupon.exists({ storeId: id });

    if (hasCoupons) {
      return jsonError(
        "Cannot delete store because it has associated coupons. Delete or reassign coupons first, or set the store to inactive.",
        400,
      );
    }

    await Store.findByIdAndDelete(id);

    return jsonSuccess({
      message: "Store deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE /api/admin/stores/[id] Error:", error);
    return handleMongoError(error);
  }
}
