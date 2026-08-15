/* app/api/admin/affiliate-products/[id]/route.js */

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/app/lib/mongodb";
import AffiliateProduct from "@/app/models/affiliateProduct";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const cleanArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
};

const normalizeProductPayload = (body) => ({
  title: body.title,
  slug: body.slug,
  shortDescription: body.shortDescription,
  description: body.description || "",
  brandName: body.brandName || "",

  expertScore:
    body.expertScore === "" || body.expertScore === undefined
      ? null
      : Number(body.expertScore),

  ribbonText: body.ribbonText || "",
  pros: cleanArray(body.pros),
  cons: cleanArray(body.cons),
  bottomLine: body.bottomLine || "",
  awardBadge: body.awardBadge || "",

  images: Array.isArray(body.images)
    ? body.images
        .filter((img) => img?.url)
        .map((img, index) => ({
          url: String(img.url).trim(),
          alt: img.alt || "",
          isPrimary: Boolean(img.isPrimary) || index === 0,
        }))
    : [],

  specifications:
    body.specifications && typeof body.specifications === "object"
      ? body.specifications
      : {},

  highlights: cleanArray(body.highlights),

  price: Number(body.price),

  originalPrice:
    body.originalPrice === "" ||
    body.originalPrice === null ||
    body.originalPrice === undefined
      ? null
      : Number(body.originalPrice),

  currency: body.currency || "USD",
  affiliateLink: body.affiliateLink,
  ctaText: body.ctaText || "View Deal",

  lastVerifiedAt: body.lastVerifiedAt
    ? new Date(body.lastVerifiedAt)
    : new Date(),

  rating:
    body.rating === "" || body.rating === undefined || body.rating === null
      ? null
      : Number(body.rating),

  reviewCount:
    body.reviewCount === "" || body.reviewCount === undefined
      ? 0
      : Number(body.reviewCount),

  categoryId: body.categoryId,
  storeId: body.storeId || null,

  status: body.status || "draft",
  displayVariant: body.displayVariant || "standard",

  isTopPick: Boolean(body.isTopPick),
  isTrending: Boolean(body.isTrending),
  isHotDeal: Boolean(body.isHotDeal),
  showInCategoryPage:
    body.showInCategoryPage === undefined
      ? true
      : Boolean(body.showInCategoryPage),

  sortOrder:
    body.sortOrder === "" || body.sortOrder === undefined
      ? 100
      : Number(body.sortOrder),

  seoTitle: body.seoTitle || "",
  seoDescription: body.seoDescription || "",
});

const validateProductPayload = (payload) => {
  const errors = {};

  if (!payload.title?.trim()) errors.title = "Title is required.";
  if (!payload.slug?.trim()) errors.slug = "Slug is required.";

  if (!payload.shortDescription?.trim()) {
    errors.shortDescription = "Short description is required.";
  }

  if (!payload.categoryId) {
    errors.categoryId = "Primary category is required.";
  } else if (!isValidObjectId(payload.categoryId)) {
    errors.categoryId = "Invalid category ID.";
  }

  if (payload.storeId && !isValidObjectId(payload.storeId)) {
    errors.storeId = "Invalid store ID.";
  }

  if (!payload.affiliateLink?.trim()) {
    errors.affiliateLink = "Affiliate link is required.";
  }

  if (!Number.isFinite(payload.price) || payload.price < 0) {
    errors.price = "Valid price is required.";
  }

  if (
    payload.originalPrice !== null &&
    (!Number.isFinite(payload.originalPrice) || payload.originalPrice < 0)
  ) {
    errors.originalPrice = "Original price must be valid.";
  }

  if (
    payload.expertScore !== null &&
    (!Number.isFinite(payload.expertScore) ||
      payload.expertScore < 0 ||
      payload.expertScore > 10)
  ) {
    errors.expertScore = "Expert score must be between 0 and 10.";
  }

  if (
    payload.rating !== null &&
    (!Number.isFinite(payload.rating) ||
      payload.rating < 1 ||
      payload.rating > 5)
  ) {
    errors.rating = "Rating must be between 1 and 5.";
  }

  if (!Number.isFinite(payload.reviewCount) || payload.reviewCount < 0) {
    errors.reviewCount = "Review count must be valid.";
  }

  if (!Number.isFinite(payload.sortOrder)) {
    errors.sortOrder = "Sort order must be valid.";
  }

  if (!payload.images.length) {
    errors.images = "At least one product image is required.";
  }

  return errors;
};

export async function GET(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid product ID." },
        { status: 400 },
      );
    }

    const product = await AffiliateProduct.findById(id)
      .populate("categoryId", "name slug")
      .populate("storeId", "name slug")
      .lean();

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Affiliate product not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        product,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/admin/affiliate-products/[id] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch affiliate product.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid product ID." },
        { status: 400 },
      );
    }

    const body = await req.json();
    const payload = normalizeProductPayload(body);
    const validationErrors = validateProductPayload(payload);

    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed.",
          errors: validationErrors,
        },
        { status: 400 },
      );
    }

    const product = await AffiliateProduct.findById(id);

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Affiliate product not found." },
        { status: 404 },
      );
    }

    Object.assign(product, payload);

    await product.save();

    return NextResponse.json(
      {
        success: true,
        message: "Affiliate product updated successfully.",
        product,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("PUT /api/admin/affiliate-products/[id] Error:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: "Duplicate field value.",
          field: Object.keys(error.keyPattern || {})[0] || "unknown",
        },
        { status: 409 },
      );
    }

    if (error.name === "ValidationError") {
      const errors = Object.fromEntries(
        Object.entries(error.errors).map(([key, value]) => [
          key,
          value.message,
        ]),
      );

      return NextResponse.json(
        {
          success: false,
          error: "Validation failed.",
          errors,
        },
        { status: 400 },
      );
    }

    if (error.name === "CastError") {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid ${error.path}.`,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update affiliate product.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid product ID." },
        { status: 400 },
      );
    }

    const deletedProduct = await AffiliateProduct.findByIdAndDelete(id);

    if (!deletedProduct) {
      return NextResponse.json(
        { success: false, error: "Affiliate product not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Affiliate product deleted successfully.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE /api/admin/affiliate-products/[id] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete affiliate product.",
      },
      { status: 500 },
    );
  }
}
