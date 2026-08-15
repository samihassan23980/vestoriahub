import mongoose from "mongoose";

function isValidUrl(str) {
  if (!str) return true;
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

const SiteSettingsSchema = new mongoose.Schema(
  {
    singletonId: {
      type: String,
      default: "VestoriaHub-global",
      unique: true,
      index: true,
    },

    // ── 1. Core Identity & SEO ─────────────────────────────
    siteName: {
      type: String,
      trim: true,
      default: "VestoriaHub",
      maxlength: 120,
    },
    siteTagline: { type: String, trim: true, default: "", maxlength: 200 },
    siteDescription: { type: String, trim: true, default: "", maxlength: 500 },
    allowIndexing: { type: Boolean, default: true },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      maxlength: 200,
    },
    adminEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      maxlength: 200,
    },
    whatsappNumber: { type: String, trim: true, default: "", maxlength: 20 },
    domainUrl: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: isValidUrl,
        message: "Must be a valid http/https URL.",
      },
    },
    defaultCountryCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: "GLOBAL",
      maxlength: 10,
    },

    // ── 2. Branding ────────────────────────────────────────
    branding: {
      logoUrl: { type: String, trim: true, default: "" },
      logoAlt: { type: String, trim: true, default: "", maxlength: 120 },
      faviconUrl: { type: String, trim: true, default: "" },
      defaultOgImage: { type: String, trim: true, default: "" },
    },

    // ── 3. Socials ─────────────────────────────────────────
    socials: {
      facebook: {
        type: String,
        trim: true,
        default: "",
        validate: [isValidUrl, "Invalid URL"],
      },
      twitter: {
        type: String,
        trim: true,
        default: "",
        validate: [isValidUrl, "Invalid URL"],
      },
      instagram: {
        type: String,
        trim: true,
        default: "",
        validate: [isValidUrl, "Invalid URL"],
      },
      tiktok: {
        type: String,
        trim: true,
        default: "",
        validate: [isValidUrl, "Invalid URL"],
      },
      pinterest: {
        type: String,
        trim: true,
        default: "",
        validate: [isValidUrl, "Invalid URL"],
      },
      linkedin: {
        type: String,
        trim: true,
        default: "",
        validate: [isValidUrl, "Invalid URL"],
      },
      youtube: {
        type: String,
        trim: true,
        default: "",
        validate: [isValidUrl, "Invalid URL"],
      },
    },

    // ── 4. Tracking & Analytics ────────────────────────────
    scripts: {
      googleAnalyticsId: { type: String, trim: true, default: "" }, // G-XXXXXXX
      googleTagManagerId: { type: String, trim: true, default: "" }, // GTM-XXXXXXX
      googleSiteVerification: { type: String, trim: true, default: "" },
      facebookPixelId: { type: String, trim: true, default: "" },
      customHeadCode: { type: String, default: "" },
      customBodyCode: { type: String, default: "" },
    },

    // ── 5. Core Affiliate IDs ──────────────────────────────
    affiliate: {
      amazonAssociateTag: { type: String, trim: true, default: "" }, // "VestoriaHub-20"
      skimlinksId: { type: String, trim: true, default: "" },
      shareasaleId: { type: String, trim: true, default: "" },
      cjPublisherId: { type: String, trim: true, default: "" },
      impactRadiusId: { type: String, trim: true, default: "" },
      awinPublisherId: { type: String, trim: true, default: "" },
    },

    // ── 6. Dynamic Network Verifications (meta/script) ─────
    affiliateCodes: [
      {
        networkName: { type: String, trim: true, maxlength: 100 },
        type: { type: String, enum: ["meta", "script"], default: "meta" },
        metaName: { type: String, trim: true },
        contentValue: { type: String, trim: true },
        isActive: { type: Boolean, default: true },
      },
    ],

    // ── 7. Platform Config ─────────────────────────────────
    platformConfig: {
      defaultCurrency: { type: String, default: "USD", maxlength: 10 },
      defaultRegion: { type: String, default: "US", maxlength: 10 },
      couponExpiryWarningDays: { type: Number, default: 3 },
      showAffiliateDisclosure: { type: Boolean, default: true },
      affiliateDisclosureText: { type: String, default: "", maxlength: 500 },
    },

    // ── 8. Feature Flags ───────────────────────────────────
    featureFlags: {
      showAmazonGallery: { type: Boolean, default: true },
      showBlogSection: { type: Boolean, default: true },
      showFeaturedDeals: { type: Boolean, default: true },
      maintenanceMode: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
);

export default mongoose.models.SiteSettings ||
  mongoose.model("SiteSettings", SiteSettingsSchema);
