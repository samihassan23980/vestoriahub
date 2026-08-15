/* app/api/admin/affiliate-networks/route.js */
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/app/lib/mongodb";
import AffiliateNetwork from "@/app/models/affiliateNetwork";

export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = ["pending", "active", "inactive"];
const MAX_LIMIT = 100;

function jsonResponse(data, status = 200) {
  return NextResponse.json(data, { status });
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeAffiliateNetworkPayload(body = {}) {
  return {
    name: body.name,
    owner: body.owner,
    websiteUrl: body.websiteUrl,
    status: body.status,
    trackingParams: body.trackingParams,
    cookieDays: body.cookieDays,
    commissionRate: body.commissionRate,
    paymentTerms: body.paymentTerms,
    minPayoutUsd: body.minPayoutUsd,
    contactEmail: body.contactEmail,
    accountManagerName: body.accountManagerName,
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
 * GET /api/admin/affiliate-networks
 *
 * Query params:
 * - page=1
 * - limit=20
 * - status=pending | active | inactive
 * - search=awin
 */
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const page = parsePositiveInt(searchParams.get("page"), 1);
    const rawLimit = parsePositiveInt(searchParams.get("limit"), 20);
    const limit = Math.min(rawLimit, MAX_LIMIT);

    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim();

    const query = {};

    if (status) {
      if (!ALLOWED_STATUSES.includes(status)) {
        return jsonResponse(
          {
            success: false,
            error: "Invalid status filter.",
            details: `Allowed values are: ${ALLOWED_STATUSES.join(", ")}.`,
            field: "status",
          },
          400,
        );
      }

      query.status = status;
    }

    if (search) {
      const safeSearch = escapeRegex(search);

      query.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { owner: { $regex: safeSearch, $options: "i" } },
        { websiteUrl: { $regex: safeSearch, $options: "i" } },
        { contactEmail: { $regex: safeSearch, $options: "i" } },
        { accountManagerName: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [networks, total] = await Promise.all([
      AffiliateNetwork.find(query)
        .sort({
          status: 1,
          name: 1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      AffiliateNetwork.countDocuments(query),
    ]);

    return jsonResponse(
      {
        success: true,
        data: {
          networks,
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
    console.error("GET /api/admin/affiliate-networks error:", error);

    return jsonResponse(
      {
        success: false,
        error: "Failed to fetch affiliate networks.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      500,
    );
  }
}

/**
 * POST /api/admin/affiliate-networks
 *
 * Body:
 * {
 *   name,
 *   owner,
 *   websiteUrl,
 *   status,
 *   trackingParams,
 *   cookieDays,
 *   commissionRate,
 *   paymentTerms,
 *   minPayoutUsd,
 *   contactEmail,
 *   accountManagerName
 * }
 */
export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    const payload = normalizeAffiliateNetworkPayload(body);

    const network = await AffiliateNetwork.create(payload);

    return jsonResponse(
      {
        success: true,
        message: "Affiliate network created successfully.",
        data: {
          network,
        },
      },
      201,
    );
  } catch (error) {
    console.error("POST /api/admin/affiliate-networks error:", error);

    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyPattern || {})[0] || "field";

      return jsonResponse(
        {
          success: false,
          error: "Duplicate affiliate network.",
          details:
            duplicatedField === "name"
              ? "An affiliate network with this name already exists."
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
          error: "Affiliate network validation failed.",
          details: validationErrors,
        },
        422,
      );
    }

    return jsonResponse(
      {
        success: false,
        error: "Failed to create affiliate network.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      500,
    );
  }
}
