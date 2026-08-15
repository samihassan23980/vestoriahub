import mongoose from "mongoose";
import { NextResponse } from "next/server";
import GalleryImage from "@/app/models/galleryImage";
import { connectDB } from "@/app/lib/mongodb";
import cloudinary from "@/app/lib/cloudinary";

export const dynamic = "force-dynamic";

const ALLOWED_STATUS = ["active", "draft", "archived"];
const MAX_LIMIT = 100;

function jsonResponse(data, status = 200) {
  return NextResponse.json(data, { status });
}

function parseBool(value) {
  return value === "true" || value === true;
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];

  return Array.from(
    new Set(
      tags
        .map((tag) =>
          String(tag || "")
            .trim()
            .replace(/^#/, ""),
        )
        .filter(Boolean),
    ),
  ).slice(0, 30);
}

function normalizeImagePayload(body = {}) {
  return {
    url: typeof body.url === "string" ? body.url.trim() : "",
    publicId: body.publicId || undefined,
    alt: body.alt || "",
    title: body.title || "",
    caption: body.caption || "",
    tags: normalizeTags(body.tags),
    status: ALLOWED_STATUS.includes(body.status) ? body.status : "active",
    width: body.width || null,
    height: body.height || null,
    format: body.format || null,
    bytes: body.bytes || null,
  };
}

async function deleteFromCloudinary(publicId) {
  if (!publicId) {
    return {
      success: true,
      warning: "No publicId provided.",
    };
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
    });

    if (result.result === "ok") return { success: true };

    if (result.result === "not found") {
      return {
        success: true,
        warning: "Image already deleted from Cloudinary.",
      };
    }

    return {
      success: false,
      error: `Cloudinary delete failed: ${result.result}`,
    };
  } catch (error) {
    console.error("Cloudinary delete error:", error);

    return {
      success: false,
      error: error.message,
    };
  }
}

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const id = searchParams.get("id");
    const q = searchParams.get("q")?.trim();
    const status = searchParams.get("status");
    const tags = searchParams.get("tags");
    const sortParam = (searchParams.get("sort") || "-createdAt").trim();

    const page = parsePositiveInt(searchParams.get("page"), 1);
    const rawLimit = parsePositiveInt(searchParams.get("limit"), 24);
    const limit = Math.min(rawLimit, MAX_LIMIT);

    if (id) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return jsonResponse(
          {
            success: false,
            Result: "Error",
            error: "Valid image id required.",
            message: "Valid image id required.",
          },
          400,
        );
      }

      const image = await GalleryImage.findById(id).lean();

      if (!image) {
        return jsonResponse(
          {
            success: false,
            Result: "Error",
            error: "Image not found.",
            message: "Image not found.",
          },
          404,
        );
      }

      return jsonResponse(
        {
          success: true,
          Result: "Success",
          data: image,
        },
        200,
      );
    }

    const filter = {};

    if (status) {
      if (!ALLOWED_STATUS.includes(status)) {
        return jsonResponse(
          {
            success: false,
            Result: "Error",
            error: "Invalid status filter.",
            message: "Invalid status filter.",
          },
          400,
        );
      }

      filter.status = status;
    }

    if (tags) {
      filter.tags = {
        $in: tags
          .split(",")
          .map((tag) => tag.trim().replace(/^#/, ""))
          .filter(Boolean),
      };
    }

    let projection = {};
    let sort = {};

    if (q) {
      filter.$text = { $search: q };
      projection = { score: { $meta: "textScore" } };
      sort = { score: { $meta: "textScore" } };
    }

    if (!Object.keys(sort).length && sortParam) {
      if (sortParam.startsWith("-")) sort[sortParam.slice(1)] = -1;
      else if (sortParam.startsWith("+")) sort[sortParam.slice(1)] = 1;
      else sort[sortParam] = 1;
    }

    const skip = (page - 1) * limit;

    const [images, total] = await Promise.all([
      GalleryImage.find(filter, projection)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      GalleryImage.countDocuments(filter),
    ]);

    return jsonResponse(
      {
        success: true,
        Result: "Success",
        data: images,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      200,
    );
  } catch (error) {
    console.error("GET /api/gallery error:", error);

    return jsonResponse(
      {
        success: false,
        Result: "Error",
        error: "Failed to fetch gallery images.",
        message: "Failed to fetch gallery images.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      500,
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const payload = normalizeImagePayload(body);

    if (!payload.url) {
      return jsonResponse(
        {
          success: false,
          Result: "Error",
          error: "Missing required field: url.",
          message: "Missing required field: url.",
        },
        400,
      );
    }

    if (!isValidUrl(payload.url)) {
      return jsonResponse(
        {
          success: false,
          Result: "Error",
          error: "Invalid image URL.",
          message: "Invalid image URL.",
          field: "url",
        },
        422,
      );
    }

    const image = await GalleryImage.create(payload);

    return jsonResponse(
      {
        success: true,
        Result: "Success",
        message: "Image saved successfully.",
        data: image,
      },
      201,
    );
  } catch (error) {
    console.error("POST /api/gallery error:", error);

    if (error.code === 11000) {
      return jsonResponse(
        {
          success: false,
          Result: "Error",
          error: "Duplicate image.",
          message: "Image already exists.",
          field: Object.keys(error.keyPattern || {})[0] || "url",
        },
        409,
      );
    }

    return jsonResponse(
      {
        success: false,
        Result: "Error",
        error: "Failed to save image.",
        message: "Failed to save image.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      500,
    );
  }
}

export async function PUT(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return jsonResponse(
        {
          success: false,
          Result: "Error",
          error: "Valid 'id' query param required.",
          message: "Valid 'id' query param required.",
        },
        400,
      );
    }

    const body = await request.json();
    const updates = normalizeImagePayload(body);

    if (updates.url && !isValidUrl(updates.url)) {
      return jsonResponse(
        {
          success: false,
          Result: "Error",
          error: "Invalid image URL.",
          message: "Invalid image URL.",
          field: "url",
        },
        422,
      );
    }

    const updated = await GalleryImage.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) {
      return jsonResponse(
        {
          success: false,
          Result: "Error",
          error: "Image not found.",
          message: "Image not found.",
        },
        404,
      );
    }

    return jsonResponse(
      {
        success: true,
        Result: "Success",
        message: "Image updated successfully.",
        data: updated,
      },
      200,
    );
  } catch (error) {
    console.error("PUT /api/gallery error:", error);

    return jsonResponse(
      {
        success: false,
        Result: "Error",
        error: "Failed to update image.",
        message: "Failed to update image.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      500,
    );
  }
}

export async function DELETE(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const hard = parseBool(searchParams.get("hard"));

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return jsonResponse(
        {
          success: false,
          Result: "Error",
          error: "Valid 'id' query param required.",
          message: "Valid 'id' query param required.",
        },
        400,
      );
    }

    if (hard) {
      const image = await GalleryImage.findById(id).lean();

      if (!image) {
        return jsonResponse(
          {
            success: false,
            Result: "Error",
            error: "Image not found.",
            message: "Image not found.",
          },
          404,
        );
      }

      const cloudinaryResult = await deleteFromCloudinary(image.publicId);

      await GalleryImage.findByIdAndDelete(id);

      return jsonResponse(
        {
          success: true,
          Result: "Success",
          message: "Image permanently deleted.",
          cloudinary: cloudinaryResult,
        },
        200,
      );
    }

    const archived = await GalleryImage.findByIdAndUpdate(
      id,
      { $set: { status: "archived" } },
      { new: true },
    ).lean();

    if (!archived) {
      return jsonResponse(
        {
          success: false,
          Result: "Error",
          error: "Image not found.",
          message: "Image not found.",
        },
        404,
      );
    }

    return jsonResponse(
      {
        success: true,
        Result: "Success",
        message: "Image archived successfully.",
        data: archived,
      },
      200,
    );
  } catch (error) {
    console.error("DELETE /api/gallery error:", error);

    return jsonResponse(
      {
        success: false,
        Result: "Error",
        error: "Failed to delete image.",
        message: "Failed to delete image.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      500,
    );
  }
}
