import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/app/lib/mongodb";

import Category from "@/app/models/category";
import Store from "@/app/models/store";
import Coupon from "@/app/models/coupon";
import Blog from "@/app/models/blog";
import AmazonDeal from "@/app/models/amazonDeal";
import AffiliateProduct from "@/app/models/affiliateProduct";

export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = ["active", "inactive"];
// 🔥 ADDED: Allowed Module Types
const ALLOWED_TYPES = ["store", "blog", "product", "general"];

function jsonResponse(data, status = 200) {
  return NextResponse.json(data, { status });
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function normalizeCategoryPayload(body = {}) {
  const payload = {};

  const allowedFields = [
    "name",
    "slug",
    "type", // 🔥 ADDED: Explicitly allow type updating
    "shortDescription",
    "description",
    "image",
    "icon",
    "uiConfig",
    "aggregateRating",
    "status",
    "isFeatured",
    "featuredOrder",
    "parentId",
    "sortOrder",
    "bestStores",
    "seo",
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
  }

  if (payload.parentId === "" || payload.parentId === "null") {
    payload.parentId = null;
  }

  if (payload.parentId && !isValidObjectId(String(payload.parentId))) {
    throw new Error("Invalid parentId.");
  }

  if (Array.isArray(payload.bestStores)) {
    payload.bestStores = payload.bestStores.filter((id) =>
      isValidObjectId(String(id)),
    );
  }

  return payload;
}

function formatMongooseValidationError(error) {
  if (error instanceof mongoose.Error.ValidationError) {
    return Object.values(error.errors).map((err) => ({
      field: err.path,
      message: err.message,
    }));
  }

  return null;
}

async function populateCategoryQuery(query) {
  return query
    .populate("parentId", "name slug level status type") // Added 'type'
    .populate("ancestors", "name slug level type") // Added 'type'
    .populate("bestStores", "name slug images.logo isActive")
    .lean();
}

/**
 * GET /api/admin/categories/:id
 */
export async function GET(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return jsonResponse(
        { success: false, error: "Invalid category ID." },
        400,
      );
    }

    const category = await populateCategoryQuery(Category.findById(id));

    if (!category) {
      return jsonResponse(
        { success: false, error: "Category not found." },
        404,
      );
    }

    const [
      childCategories,
      primaryStores,
      secondaryStores,
      primaryCoupons,
      secondaryCoupons,
      blogs,
      amazonDeals,
      affiliateProducts,
    ] = await Promise.all([
      Category.countDocuments({ parentId: id }),
      Store.countDocuments({ primaryCategoryId: id }),
      Store.countDocuments({ subCategoryIds: id }),
      Coupon.countDocuments({ categoryId: id }),
      Coupon.countDocuments({ secondaryCategoryIds: id }),
      Blog.countDocuments({ category: id }),
      AmazonDeal.countDocuments({ category: id }),
      AffiliateProduct.countDocuments({ categoryId: id }),
    ]);

    return jsonResponse(
      {
        success: true,
        data: {
          category,
          usageStats: {
            childCategories,
            primaryStores,
            secondaryStores,
            primaryCoupons,
            secondaryCoupons,
            blogs,
            amazonDeals,
            affiliateProducts,
          },
        },
      },
      200,
    );
  } catch (error) {
    console.error("GET /api/admin/categories/[id] error:", error);

    return jsonResponse(
      {
        success: false,
        error: "Failed to fetch category.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      500,
    );
  }
}

/**
 * PUT /api/admin/categories/:id
 */
export async function PUT(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return jsonResponse(
        { success: false, error: "Invalid category ID." },
        400,
      );
    }

    const body = await req.json();
    const payload = normalizeCategoryPayload(body);

    if (payload.status && !ALLOWED_STATUSES.includes(payload.status)) {
      return jsonResponse(
        {
          success: false,
          error: "Invalid category status.",
          details: `Allowed values are: ${ALLOWED_STATUSES.join(", ")}.`,
        },
        400,
      );
    }

    // 🔥 ADDED: Validate 'type' updates
    if (payload.type && !ALLOWED_TYPES.includes(payload.type)) {
      return jsonResponse(
        {
          success: false,
          error: "Invalid category module type.",
          details: `Allowed values are: ${ALLOWED_TYPES.join(", ")}.`,
        },
        400,
      );
    }

    if (payload.parentId && String(payload.parentId) === String(id)) {
      return jsonResponse(
        {
          success: false,
          error: "Invalid parent category.",
          details: "Category parentId cannot reference itself.",
        },
        400,
      );
    }

    // We fetch the current category state to validate logic against its current or incoming 'type'
    const currentCategory = await Category.findById(id).lean();
    if (!currentCategory) {
      return jsonResponse(
        { success: false, error: "Category not found." },
        404,
      );
    }

    const finalType = payload.type || currentCategory.type;

    if (payload.parentId) {
      const parent = await Category.findById(payload.parentId)
        .select("_id level status ancestors type") // Added 'type' scope
        .lean();

      if (!parent) {
        return jsonResponse(
          { success: false, error: "Parent category not found." },
          404,
        );
      }

      if (parent.status !== "active") {
        return jsonResponse(
          {
            success: false,
            error: "Inactive category cannot be used as parent.",
          },
          400,
        );
      }

      // 🔥 ADDED: Strict rule — Prevent nesting mismatching module types
      if (finalType !== parent.type && parent.type !== "general") {
        return jsonResponse(
          {
            success: false,
            error: "Type mismatch.",
            details: `A '${finalType}' category cannot be placed under a '${parent.type}' parent.`,
          },
          400,
        );
      }

      if (parent.level >= 2) {
        return jsonResponse(
          {
            success: false,
            error: "Invalid parent category.",
            details:
              "This parent is already level 2. Maximum hierarchy allowed is L0 → L1 → L2.",
          },
          400,
        );
      }

      const wouldCreateCycle = (parent.ancestors || []).some(
        (ancestorId) => String(ancestorId) === String(id),
      );

      if (wouldCreateCycle) {
        return jsonResponse(
          {
            success: false,
            error: "Circular category hierarchy detected.",
          },
          400,
        );
      }
    }

    // Grab the live document, apply updates, and trigger pre-save hooks
    const categoryDoc = await Category.findById(id);
    Object.assign(categoryDoc, payload);
    await categoryDoc.save();

    const updatedCategory = await populateCategoryQuery(
      Category.findById(categoryDoc._id),
    );

    return jsonResponse(
      {
        success: true,
        message: "Category updated successfully.",
        data: {
          category: updatedCategory,
        },
      },
      200,
    );
  } catch (error) {
    console.error("PUT /api/admin/categories/[id] error:", error);

    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyPattern || {})[0] || "field";

      return jsonResponse(
        {
          success: false,
          error: "Duplicate category record.",
          details:
            duplicatedField === "slug"
              ? "URL slug must be unique."
              : `Duplicate value for ${duplicatedField}.`,
          field: duplicatedField,
        },
        409,
      );
    }

    const validationErrors = formatMongooseValidationError(error);

    if (validationErrors) {
      return jsonResponse(
        {
          success: false,
          error: "Category validation failed.",
          details: validationErrors,
        },
        422,
      );
    }

    return jsonResponse(
      {
        success: false,
        error: "Failed to update category.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      500,
    );
  }
}

/**
 * DELETE /api/admin/categories/:id
 */
export async function DELETE(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return jsonResponse(
        { success: false, error: "Invalid category ID." },
        400,
      );
    }

    const category = await Category.findById(id).lean();

    if (!category) {
      return jsonResponse(
        { success: false, error: "Category not found." },
        404,
      );
    }

    const [
      childCategories,
      primaryStores,
      secondaryStores,
      primaryCoupons,
      secondaryCoupons,
      blogs,
      amazonDeals,
      affiliateProducts,
    ] = await Promise.all([
      Category.exists({ parentId: id }),
      Store.exists({ primaryCategoryId: id }),
      Store.exists({ subCategoryIds: id }),
      Coupon.exists({ categoryId: id }),
      Coupon.exists({ secondaryCategoryIds: id }),
      Blog.exists({ category: id }),
      AmazonDeal.exists({ category: id }),
      AffiliateProduct.exists({ categoryId: id }),
    ]);

    const usage = {
      childCategories: Boolean(childCategories),
      primaryStores: Boolean(primaryStores),
      secondaryStores: Boolean(secondaryStores),
      primaryCoupons: Boolean(primaryCoupons),
      secondaryCoupons: Boolean(secondaryCoupons),
      blogs: Boolean(blogs),
      amazonDeals: Boolean(amazonDeals),
      affiliateProducts: Boolean(affiliateProducts),
    };

    const isUsed = Object.values(usage).some(Boolean);

    if (isUsed) {
      return jsonResponse(
        {
          success: false,
          error: "Category cannot be deleted.",
          details:
            "This category is linked to existing content. Reassign or remove related records first, or set category status to inactive.",
          usage,
        },
        409,
      );
    }

    await Category.findByIdAndDelete(id);

    return jsonResponse(
      {
        success: true,
        message: "Category deleted successfully.",
      },
      200,
    );
  } catch (error) {
    console.error("DELETE /api/admin/categories/[id] error:", error);

    return jsonResponse(
      {
        success: false,
        error: "Failed to delete category.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      500,
    );
  }
}
