import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/app/lib/mongodb";
import Category from "@/app/models/category";
import Store from "@/app/models/store";

export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = ["active", "inactive"];
const ALLOWED_TYPES = ["store", "blog", "product", "general"];
const MAX_LIMIT = 100;

function jsonResponse(data, status = 200) {
  return NextResponse.json(data, { status });
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function slugify(text = "") {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function generateSeoFriendlySlug(name, type, userProvidedSlug) {
  let baseSlug = userProvidedSlug ? slugify(userProvidedSlug) : slugify(name);

  const baseExists = await Category.exists({ slug: baseSlug });
  if (!baseExists) {
    return baseSlug;
  }

  const formattedType = type ? slugify(type) : "general";
  let typeAppendedSlug = `${baseSlug}-${formattedType}`;

  const typeSlugExists = await Category.exists({ slug: typeAppendedSlug });
  if (!typeSlugExists) {
    return typeAppendedSlug;
  }

  let count = 1;
  let finalSlug = `${typeAppendedSlug}-${count}`;
  while (await Category.exists({ slug: finalSlug })) {
    count++;
    finalSlug = `${typeAppendedSlug}-${count}`;
  }

  return finalSlug;
}

function normalizeCategoryPayload(body = {}) {
  const payload = {};

  const allowedFields = [
    "name",
    "slug",
    "type",
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

  if (payload.parentId && !isValidObjectId(payload.parentId)) {
    throw new Error("INVALID_PARENT_ID_FORMAT");
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
      message: `${err.path} is invalid: ${err.message}`,
    }));
  }
  return null;
}

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const page = parsePositiveInt(searchParams.get("page"), 1);
    const rawLimit = parsePositiveInt(searchParams.get("limit"), 50);
    const limit = Math.min(rawLimit, MAX_LIMIT);

    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const parentId = searchParams.get("parentId");
    const level = searchParams.get("level");
    const isFeatured = searchParams.get("isFeatured");
    const search = searchParams.get("search")?.trim();

    const query = {};

    if (status) {
      if (!ALLOWED_STATUSES.includes(status)) {
        return jsonResponse(
          {
            success: false,
            error: "Invalid category status filter.",
            solution: `Please select one of the allowed status values: ${ALLOWED_STATUSES.join(", ")}.`,
          },
          400,
        );
      }
      query.status = status;
    }

    if (type) {
      if (!ALLOWED_TYPES.includes(type)) {
        return jsonResponse(
          {
            success: false,
            error: "Invalid category module type filter.",
            solution: `Please select one of the allowed types: ${ALLOWED_TYPES.join(", ")}.`,
          },
          400,
        );
      }
      query.type = type;
    }

    if (parentId !== null) {
      if (parentId === "null" || parentId === "") {
        query.parentId = null;
      } else {
        if (!isValidObjectId(parentId)) {
          return jsonResponse(
            {
              success: false,
              error: "Invalid parent category ID provided in filter.",
              solution: "Make sure the parentId is a valid 24-character database ID.",
            },
            400,
          );
        }
        query.parentId = parentId;
      }
    }

    if (level !== null) {
      const parsedLevel = Number.parseInt(level, 10);

      if (![0, 1, 2].includes(parsedLevel)) {
        return jsonResponse(
          {
            success: false,
            error: "Invalid category level filter.",
            solution: "Categories can only be set to Level 0 (Main), Level 1 (Sub-category), or Level 2 (Sub-sub-category).",
          },
          400,
        );
      }

      query.level = parsedLevel;
    }

    if (isFeatured !== null) {
      if (!["true", "false"].includes(isFeatured)) {
        return jsonResponse(
          {
            success: false,
            error: "Invalid featured filter.",
            solution: "Please filter 'isFeatured' using either 'true' or 'false'.",
          },
          400,
        );
      }

      query.isFeatured = isFeatured === "true";
    }

    if (search) {
      const safeSearch = escapeRegex(search);

      query.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { slug: { $regex: safeSearch, $options: "i" } },
        { shortDescription: { $regex: safeSearch, $options: "i" } },
        { description: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [categories, total] = await Promise.all([
      Category.find(query)
        .populate("parentId", "name slug level status type")
        .populate("ancestors", "name slug level type")
        .populate("bestStores", "name slug images.logo isActive")
        .sort({
          level: 1,
          sortOrder: 1,
          name: 1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      Category.countDocuments(query),
    ]);

    return jsonResponse(
      {
        success: true,
        data: {
          categories,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
            hasPrevPage: page > 1,
          },
        },
      },
      200,
    );
  } catch (error) {
    console.error("GET /api/admin/categories error:", error);

    return jsonResponse(
      {
        success: false,
        error: "We could not fetch the category list.",
        solution: "Please refresh the page or check your database connection.",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      500,
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    
    let payload;
    try {
      payload = normalizeCategoryPayload(body);
    } catch (normErr) {
      if (normErr.message === "INVALID_PARENT_ID_FORMAT") {
        return jsonResponse(
          {
            success: false,
            error: "The parent category ID format is invalid.",
            solution: "Please re-select the parent category from the dropdown menu.",
          },
          400,
        );
      }
      throw normErr;
    }

    if (payload.status && !ALLOWED_STATUSES.includes(payload.status)) {
      return jsonResponse(
        {
          success: false,
          error: "Selected category status is invalid.",
          solution: `Please set status to either 'active' or 'inactive'.`,
        },
        400,
      );
    }

    if (payload.type && !ALLOWED_TYPES.includes(payload.type)) {
      return jsonResponse(
        {
          success: false,
          error: "Selected module type is invalid.",
          solution: `Choose a valid module type from: ${ALLOWED_TYPES.join(", ")}.`,
        },
        400,
      );
    }

    if (payload.parentId) {
      const parent = await Category.findById(payload.parentId)
        .select("_id level status name type")
        .lean();

      if (!parent) {
        return jsonResponse(
          {
            success: false,
            error: "Selected parent category does not exist.",
            solution: "Please choose an active parent category from the dropdown.",
          },
          404,
        );
      }

      if (parent.status !== "active") {
        return jsonResponse(
          {
            success: false,
            error: "The selected parent category is inactive.",
            solution: "Activate the parent category first or select a different parent category.",
          },
          400,
        );
      }

      if (
        payload.type &&
        parent.type &&
        payload.type !== parent.type &&
        parent.type !== "general"
      ) {
        return jsonResponse(
          {
            success: false,
            error: `Cannot assign a '${parent.type}' parent to a '${payload.type}' category.`,
            solution: `Please choose a parent category that is either set to '${payload.type}' or 'general'.`,
          },
          400,
        );
      }

      if (parent.level >= 2) {
        return jsonResponse(
          {
            success: false,
            error: "Category tree depth limit reached.",
            solution: "You cannot create a sub-category under a Level 2 category. Max allowed hierarchy depth is L0 (Main) → L1 (Sub) → L2 (Sub-sub).",
          },
          400,
        );
      }
    }

    payload.slug = await generateSeoFriendlySlug(
      payload.name || "category",
      payload.type || "general",
      payload.slug,
    );

    const category = await Category.create(payload);

    const populatedCategory = await Category.findById(category._id)
      .populate("parentId", "name slug level status type")
      .populate("ancestors", "name slug level type")
      .populate("bestStores", "name slug images.logo isActive")
      .lean();

    return jsonResponse(
      {
        success: true,
        message: "Category created successfully.",
        data: {
          category: populatedCategory,
        },
      },
      201,
    );
  } catch (error) {
    console.error("POST /api/admin/categories error:", error);

    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyPattern || {})[0] || "field";

      return jsonResponse(
        {
          success: false,
          error: "A category with this information already exists.",
          solution:
            duplicatedField === "slug"
              ? "This URL slug is already taken. Please change the name or slug."
              : `The value for field '${duplicatedField}' must be unique.`,
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
          error: "Please fix the invalid inputs in your form.",
          solution: "Review the inline form errors and resubmit.",
          details: validationErrors,
        },
        422,
      );
    }

    return jsonResponse(
      {
        success: false,
        error: "Failed to create category.",
        solution: "An unknown system error occurred. Please try again or contact support.",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      500,
    );
  }
}