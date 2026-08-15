/* app/api/admin/affiliate-products/route.js */

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/app/lib/mongodb";
import AffiliateProduct from "@/app/models/affiliateProduct";
import Blog from "@/app/models/blog";
import Category from "@/app/models/category"; // Add this
import User from "@/app/models/user"; // 🔥 ADD THIS TO FIX THE ERROR
import Store from "@/app/models/store";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const parseBoolean = (value) => {
  if (value === null || value === undefined || value === "") return undefined;
  return value === "true";
};

const parsePositiveInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const cleanArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
};

const normalizeProductPayload = (body) => {
  const payload = {
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
          .map((img) => ({
            url: String(img.url).trim(),
            alt: img.alt || "",
            isPrimary: Boolean(img.isPrimary),
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
  };

  return payload;
};

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
    errors.originalPrice = "Original price must be a valid number.";
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
    errors.reviewCount = "Review count must be a valid number.";
  }

  if (!Number.isFinite(payload.sortOrder)) {
    errors.sortOrder = "Sort order must be a valid number.";
  }

  if (!payload.images.length) {
    errors.images = "At least one product image is required.";
  }

  return errors;
};

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const page = parsePositiveInt(searchParams.get("page"), 1);
    const limit = Math.min(
      parsePositiveInt(searchParams.get("limit"), 10),
      100,
    );

    const categoryId = searchParams.get("categoryId");
    const storeId = searchParams.get("storeId");
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const displayVariant = searchParams.get("displayVariant");

    const isTopPick = parseBoolean(searchParams.get("isTopPick"));
    const isTrending = parseBoolean(searchParams.get("isTrending"));
    const isHotDeal = parseBoolean(searchParams.get("isHotDeal"));
    const showInCategoryPage = parseBoolean(
      searchParams.get("showInCategoryPage"),
    );

    const query = {};

    if (categoryId) {
      if (!isValidObjectId(categoryId)) {
        return NextResponse.json(
          { error: "Invalid category ID." },
          { status: 400 },
        );
      }
      query.categoryId = categoryId;
    }

    if (storeId) {
      if (!isValidObjectId(storeId)) {
        return NextResponse.json(
          { error: "Invalid store ID." },
          { status: 400 },
        );
      }
      query.storeId = storeId;
    }

    if (status) query.status = status;
    if (displayVariant) query.displayVariant = displayVariant;

    if (isTopPick !== undefined) query.isTopPick = isTopPick;
    if (isTrending !== undefined) query.isTrending = isTrending;
    if (isHotDeal !== undefined) query.isHotDeal = isHotDeal;
    if (showInCategoryPage !== undefined) {
      query.showInCategoryPage = showInCategoryPage;
    }

    if (search?.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { brandName: { $regex: search.trim(), $options: "i" } },
        { shortDescription: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const [products, total] = await Promise.all([
      AffiliateProduct.find(query)
        .populate("categoryId", "name slug")
        .populate("storeId", "name slug")
        .sort({
          isTopPick: -1,
          isHotDeal: -1,
          isTrending: -1,
          sortOrder: 1,
          createdAt: -1,
        })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      AffiliateProduct.countDocuments(query),
    ]);

    return NextResponse.json(
      {
        success: true,
        products,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /admin/affiliate-products Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch affiliate products.",
      },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();

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

    const product = await AffiliateProduct.create(payload);

    return NextResponse.json(
      {
        success: true,
        message: "Affiliate product created successfully.",
        product,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /admin/affiliate-products Error:", error);

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
        error: "Failed to create affiliate product.",
      },
      { status: 500 },
    );
  }
}
