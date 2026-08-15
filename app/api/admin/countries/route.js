/* app/api/admin/countries/route.js */
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/app/lib/mongodb";
import Country from "@/app/models/country";

export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = ["active", "inactive"];
const MAX_LIMIT = 100;

function jsonResponse(data, status = 200) {
  return NextResponse.json(data, { status });
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeCountryPayload(body = {}) {
  return {
    code: body.code,
    name: body.name,
    status: body.status,
    flag: body.flag,
    isPopular: body.isPopular,
    sortOrder: body.sortOrder,
    currencyCode: body.currencyCode,
    currencySymbol: body.currencySymbol,
    timezone: body.timezone,
  };
}

function formatMongooseError(error) {
  if (error instanceof mongoose.Error.ValidationError) {
    return Object.values(error.errors).map((err) => ({
      field: err.path,
      message: err.message,
    }));
  }

  return null;
}

/**
 * GET /api/admin/countries
 *
 * Query params:
 * - page=1
 * - limit=20
 * - status=active | inactive
 * - isPopular=true | false
 * - search=pak
 */
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const page = parsePositiveInt(searchParams.get("page"), 1);
    const rawLimit = parsePositiveInt(searchParams.get("limit"), 20);
    const limit = Math.min(rawLimit, MAX_LIMIT);

    const status = searchParams.get("status");
    const isPopular = searchParams.get("isPopular");
    const search = searchParams.get("search")?.trim();

    const query = {};

    if (status) {
      if (!ALLOWED_STATUSES.includes(status)) {
        return jsonResponse(
          {
            success: false,
            error: "Invalid status filter.",
            details: `Allowed values are: ${ALLOWED_STATUSES.join(", ")}.`,
          },
          400,
        );
      }

      query.status = status;
    }

    if (isPopular !== null) {
      if (!["true", "false"].includes(isPopular)) {
        return jsonResponse(
          {
            success: false,
            error: "Invalid isPopular filter.",
            details: "isPopular must be either true or false.",
          },
          400,
        );
      }

      query.isPopular = isPopular === "true";
    }

    if (search) {
      const safeSearch = escapeRegex(search);

      query.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { code: { $regex: safeSearch, $options: "i" } },
        { currencyCode: { $regex: safeSearch, $options: "i" } },
        { timezone: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [countries, total] = await Promise.all([
      Country.find(query)
        .sort({
          isPopular: -1,
          sortOrder: 1,
          name: 1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      Country.countDocuments(query),
    ]);

    return jsonResponse(
      {
        success: true,
        data: {
          countries,
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
    console.error("GET /api/admin/countries error:", error);

    return jsonResponse(
      {
        success: false,
        error: "Failed to fetch countries.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      500,
    );
  }
}

/**
 * POST /api/admin/countries
 *
 * Body according to Country schema:
 * {
 *   code,
 *   name,
 *   status,
 *   flag,
 *   isPopular,
 *   sortOrder,
 *   currencyCode,
 *   currencySymbol,
 *   timezone
 * }
 */
export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    const payload = normalizeCountryPayload(body);

    const country = await Country.create(payload);

    return jsonResponse(
      {
        success: true,
        message: "Country added successfully.",
        data: {
          country,
        },
      },
      201,
    );
  } catch (error) {
    console.error("POST /api/admin/countries error:", error);

    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyPattern || {})[0] || "field";

      return jsonResponse(
        {
          success: false,
          error: "Duplicate country record.",
          details:
            duplicatedField === "code"
              ? "A country with this ISO code already exists."
              : `Duplicate value for ${duplicatedField}.`,
          field: duplicatedField,
        },
        409,
      );
    }

    const validationErrors = formatMongooseError(error);

    if (validationErrors) {
      return jsonResponse(
        {
          success: false,
          error: "Country validation failed.",
          details: validationErrors,
        },
        422,
      );
    }

    return jsonResponse(
      {
        success: false,
        error: "Failed to add country.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      500,
    );
  }
}
