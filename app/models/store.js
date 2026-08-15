/**
 * @model Store
 * @description A retail brand/merchant that Sociantech has affiliate coupons for.
 * Each store has a dedicated landing page (/store/:slug) featuring its coupons,
 * deals, SEO content, and affiliate tracking configuration.
 *
 * Affiliate flow:
 *   User clicks coupon → Sociantech redirect route → tracking.trackingLink
 *   → AffiliateNetwork applies tracking params → Merchant site
 *
 * Audit fixes applied:
 *  - createdByName REMOVED — was a stale-data trap. Populate createdBy instead.
 *  - tracking.trackingLink URL validation added (invalid links = lost revenue)
 *  - content.longDescription maxlength: 15000 added (document size protection)
 *  - policy field maxlengths added (shippingInfo, returnRefundPolicy)
 *  - updatedBy field added (multi-editor audit trail)
 *  - isFeatured + featuredOrder fields added (homepage curation capability)
 *  - facts.foundedYear max validator added (prevents year: 9999)
 *  - faqs array max length: 20 validation added
 *  - Compound index on primaryCategoryId + isActive added
 *  - Country sync bug: Store pre-validate checks country.status —
 *    this now works correctly after Country model was fixed to use status enum
 */

import mongoose from "mongoose";

const { Schema } = mongoose;

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

/** SEO metadata for the store landing page */
const SeoSchema = new Schema(
  {
    metaTitle: { type: String, trim: true, default: "", maxlength: 120 },
    metaDescription: { type: String, trim: true, default: "", maxlength: 320 },

    // Canonical URL override (empty = use default /store/:slug)
    canonicalUrl: { type: String, trim: true, default: "" },

    // false = <meta name="robots" content="noindex"> (e.g. for private/test stores)
    indexable: { type: Boolean, default: true },

    // true = add rel="nofollow" to outbound links from this store page
    noFollow: { type: Boolean, default: false },

    ogTitle: { type: String, trim: true, default: "", maxlength: 120 },
    ogDescription: { type: String, trim: true, default: "", maxlength: 320 },
  },
  { _id: false },
);

/** Image with accessibility alt text */
const ImageSchema = new Schema(
  {
    url: { type: String, trim: true, default: "" },
    alt: { type: String, trim: true, default: "", maxlength: 200 },
  },
  { _id: false },
);

/** FAQ entry for the store page — renders as FAQPage JSON-LD */
const FaqSchema = new Schema(
  {
    question: { type: String, trim: true, required: true, maxlength: 200 },
    answer: { type: String, trim: true, required: true, maxlength: 1200 },
  },
  { _id: false },
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidUrl(str) {
  if (!str) return true; // Optional URL fields — empty = not set = valid
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const StoreSchema = new Schema(
  {
    // ── 1. Identity ───────────────────────────────────────────────────────

    // Brand display name (e.g. "Nike", "Amazon", "Daraz")
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
    },

    // URL slug: /store/:slug — always lowercase
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
      maxlength: 160,
    },

    /**
     * The store's official homepage URL (validated — must be http/https).
     * Used for: "Visit Store" button, JSON-LD url property.
     * NOT the affiliate link — see tracking.trackingLink for that.
     */
    officialUrl: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (v) => {
          try { new URL(v); return true; } catch { return false; }
        },
        message: "officialUrl must be a valid URL.",
      },
    },

    // ── 2. Geo-targeting ──────────────────────────────────────────────────

    /**
     * Primary country this store serves.
     * null = global store (available to all users regardless of location).
     * When set, countryCode is auto-synced from the Country document in pre-validate.
     */
    countryId: {
      type: Schema.Types.ObjectId,
      ref: "Country",
      default: null,
      index: true,
    },

    /**
     * Cached country code for fast geo-filtering without joining Country.
     * Auto-set from Country.code when countryId is set.
     * "GLOBAL" = no country restriction.
     * Do not set this manually — it is managed by the pre-validate hook.
     */
    countryCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: "GLOBAL",
      index: true,
    },

    // ── 3. Categorization ─────────────────────────────────────────────────

    // Primary taxonomy category (e.g. "Fashion", "Electronics")
    primaryCategoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },

    // Additional categories this store appears in (max 10)
    subCategoryIds: [
      { type: Schema.Types.ObjectId, ref: "Category", index: true },
    ],

    // ── 4. Affiliate Configuration ────────────────────────────────────────

    /**
     * The affiliate network this store's coupons are tracked through.
     * null = direct affiliate (store manages tracking independently).
     */
    affiliateNetworkId: {
      type: Schema.Types.ObjectId,
      ref: "AffiliateNetwork",
      default: null,
      index: true,
    },

    tracking: {
      /**
       * The affiliate redirect URL for this store.
       * When a user clicks any coupon, they are routed through this link.
       * MUST be a valid http/https URL — invalid links mean zero revenue.
       */
      trackingLink: {
        type: String,
        trim: true,
        default: "",
        validate: {
          validator: isValidUrl,
          message: "tracking.trackingLink must be a valid http/https URL.",
        },
      },

      /**
       * Default sub-ID injected into trackingLink for this store.
       * Identifies which store sent the traffic to the affiliate network.
       * Example: "nike-store" or "daraz-pk"
       */
      defaultSubid: { type: String, trim: true, default: "", maxlength: 100 },
    },

    // ── 5. Visibility ─────────────────────────────────────────────────────

    // Controls whether the store page and its coupons appear on the frontend
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    /**
     * True = this store is manually promoted on the homepage or special sections.
     * featuredOrder controls the display sequence among featured stores.
     */
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    /**
     * Sort order for the featured stores widget.
     * Lower number = displayed first. Only meaningful when isFeatured = true.
     */
    featuredOrder: {
      type: Number,
      default: 0,
      index: true,
    },

    // ── 6. Content ────────────────────────────────────────────────────────

    content: {
      // H1 heading on the store page (if different from store name)
      heading: { type: String, trim: true, default: "", maxlength: 200 },

      // 2–3 sentence intro shown in search results and store cards
      shortDescription: { type: String, trim: true, default: "", maxlength: 500 },

      /**
       * Long-form SEO description for the store landing page.
       * Written to rank for "{storeName} coupons" and related queries.
       * Rendered below the coupon grid. HTML or markdown (sanitize on display).
       */
      longDescription: { type: String, trim: true, default: "", maxlength: 15000 },

      // "Why shop at {store}?" section — trust-building copy below the long description
      whyShop: { type: String, trim: true, default: "", maxlength: 3000 },
    },

    // ── 7. Policy Information ─────────────────────────────────────────────

    policy: {
      // Free-text shipping policy (e.g. "Free shipping on orders over $50")
      shippingInfo: { type: String, trim: true, default: "", maxlength: 2000 },

      // Return & refund policy summary (e.g. "30-day hassle-free returns")
      returnRefundPolicy: { type: String, trim: true, default: "", maxlength: 2000 },
    },

    // ── 8. Store Facts ────────────────────────────────────────────────────

    facts: {
      /**
       * Year the store/brand was founded.
       * Max = current year (cannot be founded in the future).
       * Used in the store profile sidebar and JSON-LD Organization foundingDate.
       */
      foundedYear: {
        type: Number,
        default: null,
        min: 1800,
        max: new Date().getFullYear(),
      },

      // Headquarters city/country (e.g. "Lahore, Pakistan")
      headquarters: { type: String, trim: true, default: "", maxlength: 200 },

      // Customer support contact info (email, phone, or chat URL)
      customerSupport: { type: String, trim: true, default: "", maxlength: 300 },
    },

    // ── 9. Media ──────────────────────────────────────────────────────────

    images: {
      // Square logo shown in store cards and coupon listings (ideally 200×200)
      logo: { type: ImageSchema, default: () => ({}) },

      // Rectangular thumbnail for store list views (ideally 400×200)
      thumb: { type: ImageSchema, default: () => ({}) },

      // Open Graph image for social sharing (ideally 1200×630)
      og: { type: ImageSchema, default: () => ({}) },
    },

    // ── 10. SEO ───────────────────────────────────────────────────────────

    seo: { type: SeoSchema, default: () => ({}) },

    // ── 11. FAQ ───────────────────────────────────────────────────────────

    /**
     * Store-specific FAQs — rendered as FAQPage JSON-LD rich snippets.
     * Max 20: beyond this, the document grows excessively and Google typically
     * only shows 3–5 FAQ rich results anyway.
     */
    faqs: {
      type: [FaqSchema],
      default: [],
      validate: {
        validator: (v) => v.length <= 20,
        message: "faqs cannot exceed 20 items.",
      },
    },

    // ── 12. Audit Trail ───────────────────────────────────────────────────

    /**
     * User who created this store record.
     * Use: Store.findById(id).populate("createdBy", "name email") to get details.
     *
     * Note: createdByName (String) has been REMOVED.
     * Storing a name string alongside the ObjectId creates a stale-data trap —
     * if the user changes their name, the cached string becomes wrong.
     * Always populate the relation instead.
     */
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    /**
     * User who last modified this store record.
     * Set by the API route handler on every PUT/PATCH operation.
     * Critical for auditing changes to affiliate links in multi-editor teams.
     */
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

// ─── Pre-validate: Normalization + Country Sync ───────────────────────────────

StoreSchema.pre("validate", async function () {
  // Normalize core string fields
  if (this.slug) this.slug = String(this.slug).trim().toLowerCase();
  if (this.name) this.name = String(this.name).trim();
  if (this.content?.heading) this.content.heading = String(this.content.heading).trim();
  if (this.seo?.metaTitle) this.seo.metaTitle = String(this.seo.metaTitle).trim();
  if (this.countryCode) this.countryCode = String(this.countryCode).trim().toUpperCase();

  /**
   * Country synchronization:
   * If countryId is set → validate it exists + is active, then sync countryCode.
   * If countryId is null → set countryCode to "GLOBAL".
   *
   * This relies on Country.status being a String enum ("active"/"inactive").
   * Previously Country used isActive: Boolean, which caused country.status to
   * always be undefined — making the inactive check always pass (silent bug).
   * Now that Country uses status enum, this check works correctly.
   */
  if (this.countryId) {
    const country = await mongoose
      .model("Country")
      .findById(this.countryId)
      .select("code status")
      .lean();

    if (!country) throw new Error("Invalid countryId: Country not found.");
    if (country.status !== "active") throw new Error("Selected country is inactive.");

    this.countryCode = String(country.code || "GLOBAL").trim().toUpperCase();
  } else {
    this.countryCode = "GLOBAL";
  }
});

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Homepage: active featured stores ordered by featuredOrder
StoreSchema.index({ isFeatured: 1, isActive: 1, featuredOrder: 1 });

// Category page: active stores in a category
StoreSchema.index({ primaryCategoryId: 1, isActive: 1 });

// Country-filtered store listings
StoreSchema.index({ isActive: 1, countryCode: 1 });
StoreSchema.index({ isActive: 1, countryId: 1 });

// Affiliate network admin page
StoreSchema.index({ affiliateNetworkId: 1 });

// Admin search: find stores by name, heading, or description
StoreSchema.index({
  name: "text",
  "content.heading": "text",
  "content.shortDescription": "text",
});

// ─── Export ───────────────────────────────────────────────────────────────────

export default mongoose.models.Store || mongoose.model("Store", StoreSchema);
