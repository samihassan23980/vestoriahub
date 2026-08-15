/**
 * @model AmazonDeal
 * @description Represents a curated, time-limited Amazon product deal.
 * Deals are identified by ASIN (Amazon Standard Identification Number) and
 * enriched with pricing, social proof, and categorization metadata.
 *
 * Affiliate links are NOT stored raw. They are generated dynamically:
 *   https://www.amazon.com/dp/{asin}?tag={associatesTag}
 * customAffiliateLink is a fallback for non-standard/deep-link cases only.
 *
 * Audit fixes applied:
 *  - ASIN format validation added (/^[A-Z0-9]{10}$/)
 *  - dealPrice <= originalPrice validation enforced in pre-save
 *  - category changed from raw String to ObjectId ref (Category model)
 *  - rating default changed from 4.5 to null (prevents fake social proof)
 *  - clicks field removed — use AnalyticsEvent for click tracking
 *  - countryCode field added for geo-targeted deal display
 *  - imageUrl URL validation added
 *  - associatesTag field added for centralized tag management
 *  - tags deduplication added in pre-save hook
 *  - slug lowercase + trim normalization added
 *  - discountPercentage range clamped to 0–100
 *  - Compound indexes added for common query patterns
 */

import mongoose from "mongoose";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const AmazonDealSchema = new mongoose.Schema(
  {
    // ── 1. Identity ────────────────────────────────────────────────────────

    // SEO-friendly display title (e.g. "Apple AirPods Pro 2nd Gen – 30% Off")
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 220,
    },

    // URL slug: /amazon-deals/:slug — must be lowercase, URL-safe
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
      maxlength: 200,
    },

    /**
     * Amazon Standard Identification Number.
     * Always 10 uppercase alphanumeric characters (B00XXXXXXX or numeric).
     * This is the primary key for all Amazon product operations.
     */
    asin: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
      maxlength: 10,
      validate: {
        validator: (v) => /^[A-Z0-9]{10}$/.test(v),
        message: "ASIN must be exactly 10 uppercase alphanumeric characters.",
      },
    },

    /**
     * Amazon Associates tag for this deal (e.g. "sociantech-21").
     * Stored here so it can be rotated or A/B tested per deal without
     * touching the frontend. Affiliate link = amazon.com/dp/{asin}?tag={this}
     */
    associatesTag: {
      type: String,
      trim: true,
      default: "",
      maxlength: 60,
    },

    // Custom editorial description: "Why buy this?" or curated review text.
    // Frontend renders this as markdown or HTML. Sanitize before display.
    description: {
      type: String,
      default: "",
      maxlength: 5000,
    },

    // ── 2. Media ───────────────────────────────────────────────────────────

    // Primary product image URL (Amazon CDN or our hosted copy)
    imageUrl: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isValidUrl,
        message: "imageUrl must be a valid http/https URL.",
      },
    },

    // ── 3. Pricing ────────────────────────────────────────────────────────

    // Listed price before the deal (MRP / strike-through price). In USD cents
    // or smallest currency unit to avoid float precision issues is recommended,
    // but we use float here for simplicity — do NOT do arithmetic on these in JS.
    originalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    // Current deal price. Validated in pre-save to be <= originalPrice.
    dealPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    /**
     * Auto-calculated discount percentage. Stored for fast query/filter:
     * e.g. "show me deals with >= 50% off".
     * Recalculated on every save via pre-save hook.
     * Clamped to [0, 100] range.
     */
    discountPercentage: {
      type: Number,
      index: true,
      min: 0,
      max: 100,
    },

    // ── 4. Amazon Conversion Signals ──────────────────────────────────────

    // Prime badge — boosts CTR significantly; show lightning bolt icon on card
    isPrime: { type: Boolean, default: false },

    // Amazon's Choice badge for the product's category
    isAmazonChoice: { type: Boolean, default: false },

    // Best Seller rank badge in its category
    isBestSeller: { type: Boolean, default: false },

    // ── 5. Social Proof ───────────────────────────────────────────────────

    /**
     * Average star rating pulled from Amazon (1.0 – 5.0).
     * Default is null — not 4.5. A null rating means "not fetched yet"
     * and the frontend should show "No ratings" instead of a fake score.
     * Fake default ratings destroy user trust on affiliate sites.
     */
    rating: {
      type: Number,
      default: null,
      min: 1,
      max: 5,
    },

    // Total review count from Amazon. Display as "4,521 reviews".
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ── 6. Affiliate Tracking ─────────────────────────────────────────────

    /**
     * Fallback affiliate link for non-standard cases (deep links, bundle pages).
     * Preferred approach: generate link dynamically from ASIN + associatesTag.
     * Only populate this when the standard ASIN link is insufficient.
     */
    customAffiliateLink: {
      type: String,
      default: "",
      trim: true,
      validate: {
        validator: (v) => !v || isValidUrl(v),
        message: "customAffiliateLink must be a valid http/https URL.",
      },
    },

    // ── 7. Organization ───────────────────────────────────────────────────

    // Primary category — ObjectId ref to Category model (NOT a raw string)
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      index: true,
      default: null,
    },

    // Flexible tags for cross-category filtering (e.g. ["tech","under-50","gift-ideas"])
    // Deduplicated and trimmed in pre-save hook
    tags: [{ type: String, trim: true, maxlength: 60 }],

    /**
     * Country code for geo-targeting.
     * "GLOBAL" = deal is available in all regions.
     * Use ISO 3166-1 alpha-2 codes (US, GB, PK, IN, etc.)
     * Follows the same pattern as Store and Coupon models.
     */
    countryCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: "GLOBAL",
      index: true,
    },

    // ── 8. Deal Lifecycle ─────────────────────────────────────────────────

    /**
     * Deal visibility status.
     * "draft"   = being prepared, not visible on frontend.
     * "active"  = live and displayed to users.
     * "expired" = deal has ended; hidden but kept for historical data.
     * "archived"= manually retired; preserved for analytics.
     */
    status: {
      type: String,
      enum: ["draft", "active", "expired", "archived"],
      default: "active",
      index: true,
    },

    /**
     * When this deal expires (Amazon deals are short-lived, often 24–48 hrs).
     * A scheduled job should query { expiryDate: { $lte: now }, status: "active" }
     * and flip status to "expired". Do NOT use MongoDB TTL — we keep the data.
     */
    expiryDate: {
      type: Date,
      default: null,
      index: true,
    },

    // Whether this is featured/pinned on the deals page or homepage
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true },
);

// ─── Pre-save Hook ────────────────────────────────────────────────────────────

AmazonDealSchema.pre("save", function (next) {
  // 1. Validate price relationship — dealPrice must not exceed originalPrice
  if (this.originalPrice && this.dealPrice) {
    if (this.dealPrice > this.originalPrice) {
      return next(
        new Error(
          `dealPrice (${this.dealPrice}) cannot exceed originalPrice (${this.originalPrice}).`,
        ),
      );
    }

    // 2. Auto-calculate and clamp discount percentage to [0, 100]
    const raw =
      ((this.originalPrice - this.dealPrice) / this.originalPrice) * 100;
    this.discountPercentage = Math.min(100, Math.max(0, Math.round(raw)));
  }

  // 3. Normalize slug — always lowercase, trim
  if (this.slug) this.slug = String(this.slug).trim().toLowerCase();

  // 4. Normalize ASIN — always uppercase
  if (this.asin) this.asin = String(this.asin).trim().toUpperCase();

  // 5. Deduplicate and clean tags array
  if (Array.isArray(this.tags)) {
    const cleaned = this.tags
      .map((t) => String(t || "").trim().toLowerCase())
      .filter(Boolean);
    this.tags = [...new Set(cleaned)];
  }

  // 6. Normalize countryCode
  if (this.countryCode)
    this.countryCode = String(this.countryCode).trim().toUpperCase();

  next();
});

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Primary listing query: active deals by country, sorted by discount
AmazonDealSchema.index({ status: 1, countryCode: 1, discountPercentage: -1 });

// Category page: all active deals in a category
AmazonDealSchema.index({ category: 1, status: 1, createdAt: -1 });

// Featured deals widget on homepage
AmazonDealSchema.index({ isFeatured: 1, status: 1 });

// Expiry runner job: find deals expiring soon
AmazonDealSchema.index({ expiryDate: 1, status: 1 });

// ─── Export ───────────────────────────────────────────────────────────────────

export default mongoose.models.AmazonDeal ||
  mongoose.model("AmazonDeal", AmazonDealSchema);
