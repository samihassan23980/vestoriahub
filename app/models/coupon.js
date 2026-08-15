/**
 * @model Coupon
 * @description Core entity of the Sociantech platform.
 * Represents a promotional offer — either a code-based coupon or a codeless deal —
 * for a specific store. Coupons are the primary revenue-driving entity.
 *
 * Coupon types:
 *  type="coupon" + codeType="public"       → user copies a code (SAVE20)
 *  type="coupon" + codeType="auto_applied" → code auto-applies at checkout
 *  type="deal"                             → no code; redirect activates discount
 *
 * Audit fixes applied:
 *  - discountValue reverted to Number (was String — broke all comparison queries)
 *  - TTL index REMOVED — auto-deleting expired coupons destroys analytics history.
 *    Use a scheduled job instead to flip status to "expired".
 *  - countryCode added for geo-targeted coupon display
 *  - minOrderValue added (critical UX info — prevents checkout surprise failures)
 *  - maxDiscountCap added (for percent-type coupons with a cap e.g. "max $20 off")
 *  - terms field added (T&C / restrictions text shown before redirect)
 *  - isExclusive flag added (platform-only deals = key marketing differentiator)
 *  - isVerified + verifiedAt added (trust signal — "we checked this works")
 *  - trackingLink URL validation confirmed present and functioning
 *  - status enum extended with "expired" (explicit state vs auto-deletion)
 *  - Compound indexes refined for primary listing queries
 */

import mongoose from "mongoose";

const { Schema } = mongoose;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const CouponSchema = new Schema(
  {
    // ── 1. Display Content ────────────────────────────────────────────────

    // Primary headline shown on the coupon card (e.g. "30% Off All Electronics")
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },

    // Supporting detail line shown below title (e.g. "No minimum order required")
    subtitle: {
      type: String,
      trim: true,
      maxlength: 250,
      default: "",
    },

    /**
     * Short terms & conditions shown in a tooltip or drawer before redirect.
     * Example: "Valid on orders above $50. Excludes sale items. One use per account."
     * Critical for user trust — surprises at checkout cause site abandonment.
     */
    terms: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },

    // ── 2. Affiliate Tracking ─────────────────────────────────────────────

    /**
     * The affiliate redirect URL for this coupon.
     * User is sent here when they click "Get Deal" or "Copy Code".
     * Must be a valid http/https URL. Validated in pre-validate hook.
     */
    trackingLink: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    // ── 3. Coupon Classification ──────────────────────────────────────────

    /**
     * "coupon" = has a code (public or auto-applied).
     * "deal"   = no code; discount activates via the affiliate link alone.
     */
    type: {
      type: String,
      enum: ["coupon", "deal"],
      required: true,
      index: true,
    },

    /**
     * "public"       = code is shown to user (SAVE20). User copies and pastes.
     * "auto_applied" = code is hidden; it activates automatically via the link.
     */
    codeType: {
      type: String,
      enum: ["public", "auto_applied"],
      required: true,
      index: true,
    },

    /**
     * The coupon code string.
     * Required only when type="coupon" AND codeType="public".
     * Auto-cleared (set to "") for deals and auto-applied coupons in pre-validate.
     */
    code: {
      type: String,
      trim: true,
      default: "",
      required: function () {
        return this.type === "coupon" && this.codeType === "public";
      },
    },

    // ── 4. Discount Value ─────────────────────────────────────────────────

    /**
     * Type of discount offered.
     * "percent"      = percentage off (e.g. 30% off)
     * "flat"         = fixed amount off (e.g. $10 off)
     * "free_shipping"= shipping is waived (discountValue auto-set to 0)
     */
    discountType: {
      type: String,
      enum: ["percent", "flat", "free_shipping"],
      required: true,
      index: true,
    },

    /**
     * The numeric discount value.
     * For "percent": 0–100 (e.g. 30 = 30% off).
     * For "flat": amount in the store's currency (e.g. 10 = $10 off).
     * For "free_shipping": always 0 (auto-set in pre-validate).
     *
     * Stored as Number (NOT String) to enable comparison queries:
     *   db.coupons.find({ discountType: "percent", discountValue: { $gte: 50 } })
     * A String type would make such queries impossible without expensive $toDouble.
     */
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },

    /**
     * Maximum discount cap for percent-type coupons.
     * Example: "30% off but no more than $25 total discount".
     * null = no cap. Only meaningful when discountType="percent".
     */
    maxDiscountCap: {
      type: Number,
      default: null,
      min: 0,
    },

    /**
     * Minimum cart/order value required to use this coupon.
     * 0 = no minimum. Displayed prominently: "Min. spend: $50"
     * This is one of the most-asked-about pieces of coupon info — don't omit it.
     */
    minOrderValue: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ── 5. Lifecycle ──────────────────────────────────────────────────────

    /**
     * Coupon expiry datetime (null = no expiry / evergreen coupon).
     * A scheduled job queries { expiryDate: { $lte: now }, status: "active" }
     * and updates status to "expired". Do NOT use MongoDB TTL — it permanently
     * deletes documents, destroying historical analytics data.
     */
    expiryDate: {
      type: Date,
      default: null,
      index: true,
    },

    /**
     * Coupon visibility and usability state.
     * "active"  = live and clickable on the frontend.
     * "expired" = past its expiry date; shown as "Expired" or hidden.
     * "inactive"= manually disabled by an admin (not expired, just paused).
     *
     * TTL index REMOVED — expired coupons must be kept for analytics.
     * Transition "active" → "expired" is handled by a scheduled cron job.
     */
    status: {
      type: String,
      enum: ["active", "expired", "inactive"],
      default: "active",
      index: true,
    },

    // ── 6. Trust & Exclusivity ────────────────────────────────────────────

    /**
     * True if this coupon was verified to work at checkout.
     * Verification should be re-tested periodically (see verifiedAt).
     * Displays a "Verified" badge — major trust signal on coupon sites.
     */
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Datetime when isVerified was last set to true (for freshness display)
    verifiedAt: {
      type: Date,
      default: null,
    },

    /**
     * True if this deal is exclusive to Sociantech.
     * "Platform-only" deals are the key differentiator mentioned in the About page.
     * Displayed with an "Exclusive" badge; drives repeat visits.
     */
    isExclusive: {
      type: Boolean,
      default: false,
      index: true,
    },

    // ── 7. Geo-targeting ──────────────────────────────────────────────────

    /**
     * Country this coupon is valid in.
     * "GLOBAL" = available in all regions (default for most coupons).
     * Use ISO 3166-1 alpha-2 codes (PK, US, GB, IN, etc.).
     * Prevents showing US-only coupons to Pakistani users.
     */
    countryCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: "GLOBAL",
      index: true,
    },

    // ── 8. Admin Controls ─────────────────────────────────────────────────

    /**
     * Manual display ordering. Lower = shown first within a store's coupon list.
     * Default 1000 so new coupons go to the end unless manually promoted.
     */
    sortOrder: {
      type: Number,
      default: 1000,
      index: true,
    },

    /**
     * Pinned coupons always appear first, above sortOrder.
     * Use for "Deal of the Day" or season-critical coupons.
     */
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },

    // ── 9. Relations ──────────────────────────────────────────────────────

    // The store this coupon belongs to
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },

    // Primary category for this coupon (for category-page filtering)
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },

    /**
     * Optional secondary categories this coupon also applies to.
     * Example: A fashion coupon might appear under both "Women's" and "Sale".
     * Max 5 to prevent abuse (coupons listed in every category = spam).
     */
    secondaryCategoryIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "Category" }],
      default: [],
      validate: {
        validator: (v) => v.length <= 5,
        message: "secondaryCategoryIds cannot exceed 5 items.",
      },
    },
  },
  { timestamps: true },
);

// ─── Static Helpers ───────────────────────────────────────────────────────────

/** Default sort order for store coupon listings */
CouponSchema.statics.defaultSort = function () {
  return { isPinned: -1, sortOrder: 1, createdAt: -1 };
};

// ─── Pre-validate Hook ────────────────────────────────────────────────────────

CouponSchema.pre("validate", function () {
  // Normalize string fields
  if (this.title) this.title = String(this.title).trim();
  if (this.subtitle) this.subtitle = String(this.subtitle).trim();
  if (this.code) this.code = String(this.code).trim().toUpperCase();
  if (this.trackingLink) this.trackingLink = String(this.trackingLink).trim();
  if (this.countryCode)
    this.countryCode = String(this.countryCode).trim().toUpperCase();

  // Validate trackingLink URL format
  if (this.trackingLink && !isValidUrl(this.trackingLink)) {
    this.invalidate("trackingLink", "trackingLink must be a valid http/https URL.");
  }

  // Free shipping coupons always have a discount value of 0 (no numeric discount)
  if (this.discountType === "free_shipping") {
    this.discountValue = 0;
  }

  // Deals and auto-applied coupons never have a visible code
  if (this.type === "deal" || this.codeType === "auto_applied") {
    this.code = "";
  }

  // maxDiscountCap is only meaningful for percent-type discounts
  if (this.discountType !== "percent") {
    this.maxDiscountCap = null;
  }

  // Coerce invalid sortOrder to default
  if (typeof this.sortOrder !== "number" || Number.isNaN(this.sortOrder)) {
    this.sortOrder = 1000;
  }

  // Sanitize expiryDate — reject non-date values silently
  if (this.expiryDate && isNaN(new Date(this.expiryDate))) {
    this.expiryDate = null;
  }

  // Set verifiedAt when isVerified is first set to true
  if (this.isModified && this.isModified("isVerified") && this.isVerified && !this.verifiedAt) {
    this.verifiedAt = new Date();
  }
});

// ─── Indexes ──────────────────────────────────────────────────────────────────

/**
 * Primary store listing query:
 * "Give me all active coupons for Store X in Country Y, pinned first"
 */
CouponSchema.index({
  storeId: 1,
  status: 1,
  countryCode: 1,
  isPinned: -1,
  sortOrder: 1,
  createdAt: -1,
});

/**
 * Category page query:
 * "Give me active coupons for Category X in Country Y"
 */
CouponSchema.index({
  categoryId: 1,
  status: 1,
  countryCode: 1,
  isPinned: -1,
  sortOrder: 1,
});

// Exclusive deals widget / badge filtering
CouponSchema.index({ isExclusive: 1, status: 1 });

// Verified coupons filter
CouponSchema.index({ isVerified: 1, status: 1 });

// Expiry runner job: find active coupons past their expiry date
CouponSchema.index({ expiryDate: 1, status: 1 });

// ─── Export ───────────────────────────────────────────────────────────────────

export default mongoose.models.Coupon || mongoose.model("Coupon", CouponSchema);
