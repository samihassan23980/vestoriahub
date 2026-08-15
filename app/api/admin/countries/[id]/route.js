/* app/api/admin/countries/[id]/route.js */

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/app/lib/mongodb";

import Country from "@/app/models/country";
import Store from "@/app/models/store";
import Coupon from "@/app/models/coupon";
import AmazonDeal from "@/app/models/amazonDeal";

export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = ["active", "inactive"];

function jsonResponse(data, status = 200) {
  return NextResponse.json(data, { status });
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function normalizeCountryPayload(body = {}) {
  const payload = {};

  const allowedFields = [
    "code",
    "name",
    "status",
    "flag",
    "isPopular",
    "sortOrder",
    "currencyCode",
    "currencySymbol",
    "timezone",
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
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

/**
 * GET /api/admin/countries/:id
 */
export async function GET(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return jsonResponse(
        {
          success: false,
          error: "Invalid country ID.",
        },
        400,
      );
    }

    const country = await Country.findById(id).lean();

    if (!country) {
      return jsonResponse(
        {
          success: false,
          error: "Country not found.",
        },
        404,
      );
    }

    const countryCode = String(country.code || "")
      .trim()
      .toUpperCase();

    const [storesLinked, couponsLinked, amazonDealsLinked] = await Promise.all([
      Store.countDocuments({ countryId: id }),
      Coupon.countDocuments({ countryCode }),
      AmazonDeal.countDocuments({ countryCode }),
    ]);

    return jsonResponse(
      {
        success: true,
        data: {
          country,
          usageStats: {
            storesLinked,
            couponsLinked,
            amazonDealsLinked,
          },
        },
      },
      200,
    );
  } catch (error) {
    console.error("GET /api/admin/countries/[id] error:", error);

    return jsonResponse(
      {
        success: false,
        error: "Failed to fetch country.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      500,
    );
  }
}

/**
 * PUT /api/admin/countries/:id
 */
export async function PUT(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return jsonResponse(
        {
          success: false,
          error: "Invalid country ID.",
        },
        400,
      );
    }

    const body = await req.json();
    const payload = normalizeCountryPayload(body);

    if (payload.status && !ALLOWED_STATUSES.includes(payload.status)) {
      return jsonResponse(
        {
          success: false,
          error: "Invalid country status.",
          details: `Allowed values are: ${ALLOWED_STATUSES.join(", ")}.`,
        },
        400,
      );
    }

    const country = await Country.findById(id);

    if (!country) {
      return jsonResponse(
        {
          success: false,
          error: "Country not found.",
        },
        404,
      );
    }

    Object.assign(country, payload);

    await country.save();

    return jsonResponse(
      {
        success: true,
        message: "Country updated successfully.",
        data: {
          country,
        },
      },
      200,
    );
  } catch (error) {
    console.error("PUT /api/admin/countries/[id] error:", error);

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

    const validationErrors = formatMongooseValidationError(error);

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
        error: "Failed to update country.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      500,
    );
  }
}

/**
 * DELETE /api/admin/countries/:id
 */
export async function DELETE(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return jsonResponse(
        {
          success: false,
          error: "Invalid country ID.",
        },
        400,
      );
    }

    const country = await Country.findById(id).lean();

    if (!country) {
      return jsonResponse(
        {
          success: false,
          error: "Country not found.",
        },
        404,
      );
    }

    const countryCode = String(country.code || "")
      .trim()
      .toUpperCase();

    const [usedByStore, usedByCoupon, usedByAmazonDeal] = await Promise.all([
      Store.exists({ countryId: id }),
      Coupon.exists({ countryCode }),
      AmazonDeal.exists({ countryCode }),
    ]);

    const usage = {
      stores: Boolean(usedByStore),
      coupons: Boolean(usedByCoupon),
      amazonDeals: Boolean(usedByAmazonDeal),
    };

    const isUsed = Object.values(usage).some(Boolean);

    if (isUsed) {
      return jsonResponse(
        {
          success: false,
          error: "Country cannot be deleted.",
          details:
            "This country is linked to existing platform content. Set its status to 'inactive' instead of deleting it.",
          usage,
        },
        409,
      );
    }

    await Country.findByIdAndDelete(id);

    return jsonResponse(
      {
        success: true,
        message: "Country deleted successfully.",
      },
      200,
    );
  } catch (error) {
    console.error("DELETE /api/admin/countries/[id] error:", error);

    return jsonResponse(
      {
        success: false,
        error: "Failed to delete country.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      500,
    );
  }
}
