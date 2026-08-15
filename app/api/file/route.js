import cloudinary from "@/app/lib/cloudinary";

export const dynamic = "force-dynamic";

const DEFAULT_FOLDER = "Products images";

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function sanitizeFolder(input) {
  if (!input || typeof input !== "string") return DEFAULT_FOLDER;

  const cleaned = input
    .replace(/[^a-zA-Z0-9/_ -]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned || cleaned.includes("..")) return DEFAULT_FOLDER;

  return cleaned;
}

function validateEnv() {
  const missing = [];

  if (!process.env.CLOUDINARY_API_SECRET) missing.push("CLOUDINARY_API_SECRET");
  if (!process.env.CLOUDINARY_API_KEY) missing.push("CLOUDINARY_API_KEY");
  if (!process.env.CLOUDINARY_CLOUD_NAME) missing.push("CLOUDINARY_CLOUD_NAME");

  return missing;
}

function generateSignature(folder) {
  const timestamp = Math.round(Date.now() / 1000);

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder,
    },
    process.env.CLOUDINARY_API_SECRET,
  );

  return {
    success: true,
    signature,
    timestamp,
    api_key: process.env.CLOUDINARY_API_KEY,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    folder,
  };
}

export async function GET() {
  try {
    const missing = validateEnv();

    if (missing.length) {
      return jsonResponse(
        {
          success: false,
          error: "Cloudinary environment variables are missing.",
          details: missing,
        },
        500,
      );
    }

    return jsonResponse(generateSignature(DEFAULT_FOLDER), 200);
  } catch (error) {
    console.error("GET /api/file error:", error);

    return jsonResponse(
      {
        success: false,
        error: "Failed to generate upload signature.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      500,
    );
  }
}

export async function POST(request) {
  try {
    const missing = validateEnv();

    if (missing.length) {
      return jsonResponse(
        {
          success: false,
          error: "Cloudinary environment variables are missing.",
          details: missing,
        },
        500,
      );
    }

    const body = await request.json().catch(() => ({}));
    const folder = sanitizeFolder(body?.folder);

    return jsonResponse(generateSignature(folder), 200);
  } catch (error) {
    console.error("POST /api/file error:", error);

    return jsonResponse(
      {
        success: false,
        error: "Failed to generate upload signature.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      500,
    );
  }
}
