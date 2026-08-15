/* app/api/admin/affiliate-networks/[id]/route.js */
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/app/lib/mongodb";
import AffiliateNetwork from "@/app/models/affiliateNetwork";
import Store from "@/app/models/store";

export const dynamic = "force-dynamic";

function jsonResponse(data, status = 200) {
  return NextResponse.json(data, { status });
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
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

function removeUndefinedFields(payload = {}) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  );
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

async function getParams(params) {
  return await params;
}

/**
 * GET /api/admin/affiliate-networks/[id]
 */
export async function GET(req, { params }) {
  try {
    await connectDB();

    const { id } = await getParams(params);

    if (!id || !isValidObjectId(id)) {
      return jsonResponse(
        {
          success: false,
          error: "Invalid affiliate network id.",
          details: "A valid MongoDB ObjectId is required.",
          field: "id",
        },
        400,
      );
    }

    const network = await AffiliateNetwork.findById(id).lean();

    if (!network) {
      return jsonResponse(
        {
          success: false,
          error: "Affiliate network not found.",
        },
        404,
      );
    }

    const usageStats = {
      stores: await Store.countDocuments({ affiliateNetworkId: id }),
    };

    return jsonResponse(
      {
        success: true,
        data: {
          network,
          usageStats,
        },
      },
      200,
    );
  } catch (error) {
    console.error("GET /api/admin/affiliate-networks/[id] error:", error);

    return jsonResponse(
      {
        success: false,
        error: "Failed to fetch affiliate network.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      500,
    );
  }
}

/**
 * PUT /api/admin/affiliate-networks/[id]
 */
export async function PUT(req, { params }) {
  try {
    await connectDB();

    const { id } = await getParams(params);

    if (!id || !isValidObjectId(id)) {
      return jsonResponse(
        {
          success: false,
          error: "Invalid affiliate network id.",
          details: "A valid MongoDB ObjectId is required.",
          field: "id",
        },
        400,
      );
    }

    const body = await req.json();
    const payload = removeUndefinedFields(
      normalizeAffiliateNetworkPayload(body),
    );

    const network = await AffiliateNetwork.findById(id);

    if (!network) {
      return jsonResponse(
        {
          success: false,
          error: "Affiliate network not found.",
        },
        404,
      );
    }

    Object.assign(network, payload);

    /**
     * Save is intentional:
     * - runs pre("validate") normalization
     * - validates trackingParams placeholder
     * - validates websiteUrl
     * - validates cookieDays / commissionRate min-max
     */
    await network.save();

    return jsonResponse(
      {
        success: true,
        message: "Affiliate network updated successfully.",
        data: {
          network,
        },
      },
      200,
    );
  } catch (error) {
    console.error("PUT /api/admin/affiliate-networks/[id] error:", error);

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
        error: "Failed to update affiliate network.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      500,
    );
  }
}

/**
 * DELETE /api/admin/affiliate-networks/[id]
 */
export async function DELETE(req, { params }) {
  try {
    await connectDB();

    const { id } = await getParams(params);

    if (!id || !isValidObjectId(id)) {
      return jsonResponse(
        {
          success: false,
          error: "Invalid affiliate network id.",
          details: "A valid MongoDB ObjectId is required.",
          field: "id",
        },
        400,
      );
    }

    const usageStats = {
      stores: await Store.countDocuments({ affiliateNetworkId: id }),
    };

    if (usageStats.stores > 0) {
      return jsonResponse(
        {
          success: false,
          error: "Affiliate network is in use.",
          details:
            "Cannot delete this affiliate network because it is assigned to one or more stores. Reassign those stores or set this network to inactive.",
          usageStats,
        },
        409,
      );
    }

    const deletedNetwork = await AffiliateNetwork.findByIdAndDelete(id).lean();

    if (!deletedNetwork) {
      return jsonResponse(
        {
          success: false,
          error: "Affiliate network not found.",
        },
        404,
      );
    }

    return jsonResponse(
      {
        success: true,
        message: "Affiliate network deleted successfully.",
        data: {
          deletedNetwork,
        },
      },
      200,
    );
  } catch (error) {
    console.error("DELETE /api/admin/affiliate-networks/[id] error:", error);

    return jsonResponse(
      {
        success: false,
        error: "Failed to delete affiliate network.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      500,
    );
  }
}
