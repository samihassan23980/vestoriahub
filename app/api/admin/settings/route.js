import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import SiteSettings from "@/app/models/siteSettings";
import { revalidateTag } from "next/cache";

const SINGLETON_ID = "takesmeout-global";

export async function GET(req) {
  try {
    await connectDB();

    // Use .lean() for faster execution since we only need to read the data
    let settings = await SiteSettings.findOne({
      singletonId: SINGLETON_ID,
    }).lean();

    // Self-healing mechanism: Create the default document if it doesn't exist
    if (!settings) {
      const defaultSettings = new SiteSettings({ singletonId: SINGLETON_ID });
      await defaultSettings.save();
      settings = defaultSettings.toObject();
    }

    return NextResponse.json({ settings }, { status: 200 });
  } catch (error) {
    console.error("GET /api/admin/setting Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch site settings." },
      { status: 500 },
    );
  }
}

export async function PUT(req) {
  try {
    await connectDB();
    const body = await req.json();

    // Security: Prevent overriding the unique singletonId
    if (body.singletonId) {
      delete body.singletonId;
    }

    let settings = await SiteSettings.findOne({ singletonId: SINGLETON_ID });

    if (!settings) {
      // Fallback in case the document was manually deleted from the database
      settings = new SiteSettings({ singletonId: SINGLETON_ID });
    }

    // ── 1. Top-Level Core Identity & SEO ─────────────────────────────
    const topLevelFields = [
      "siteName",
      "siteTagline",
      "siteDescription",
      "allowIndexing",
      "contactEmail",
      "adminEmail",
      "whatsappNumber",
      "domainUrl",
      "defaultCountryCode",
    ];

    topLevelFields.forEach((field) => {
      if (body[field] !== undefined) {
        settings[field] = body[field];
      }
    });

    // ── 2-5 & 7-8. Nested Objects ──────────────────────────────────────
    // Object.assign safely updates Mongoose subdocuments while triggering validators
    if (body.branding) {
      Object.assign(settings.branding, body.branding);
    }
    if (body.socials) {
      Object.assign(settings.socials, body.socials);
    }
    if (body.scripts) {
      Object.assign(settings.scripts, body.scripts);
    }
    if (body.affiliate) {
      Object.assign(settings.affiliate, body.affiliate);
    }
    if (body.platformConfig) {
      Object.assign(settings.platformConfig, body.platformConfig);
    }
    if (body.featureFlags) {
      Object.assign(settings.featureFlags, body.featureFlags);
    }

    // ── 6. Arrays (Dynamic Network Verifications) ──────────────────────
    // Arrays require direct assignment to overwrite the existing list completely
    if (Array.isArray(body.affiliateCodes)) {
      settings.affiliateCodes = body.affiliateCodes;
    }

    // .save() is used instead of findOneAndUpdate to ensure Mongoose URL validators run
    await settings.save();

    // ── CACHE INVALIDATION ─────────────────────────────────────────────
    // Yeh line Next.js ke cache ko instantly clear karti hai taake frontend foran update ho jaye
    revalidateTag("global-site-settings");

    return NextResponse.json(
      { message: "Site settings updated successfully.", settings },
      { status: 200 },
    );
  } catch (error) {
    console.error("PUT /api/admin/setting Error:", error);

    // Capture and format Mongoose validation errors (e.g., Invalid URLs)
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return NextResponse.json(
        { error: "Validation failed.", details: messages },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error. Failed to update site settings." },
      { status: 500 },
    );
  }
}
