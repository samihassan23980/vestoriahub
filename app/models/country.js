/**
 * @model Country
 * @description Reference list of countries for geo-targeting across the platform.
 * Used by Store, Coupon, and AmazonDeal models to restrict or target content
 * to specific regions. Admins manage this list; it is not auto-populated.
 *
 * Critical bug fixed:
 *  - status changed from isActive: Boolean → status: String enum.
 *    The Store model's pre-validate hook queries country.status and checks
 *    country.status !== "active" — but with isActive: Boolean, country.status
 *    was always undefined, so inactive countries were NEVER blocked from Store
 *    assignment. This was a silent bug. Standardizing to status enum fixes it.
 *
 * Audit fixes applied:
 *  - isActive: Boolean replaced with status: String enum (bug fix, see above)
 *  - currencyCode and currencySymbol added (required for price display on deals)
 *  - flag field added (emoji or image URL for dropdown/UI display)
 *  - timezone field added (for localizing deal expiry times)
 *  - Compound index updated for new status field
 */

import mongoose from "mongoose";

const { Schema } = mongoose;

// ─── Schema ───────────────────────────────────────────────────────────────────

const CountrySchema = new Schema(
  {
    // ── 1. Identification ─────────────────────────────────────────────────

    /**
     * ISO 3166-1 alpha-2 country code (uppercase).
     * Examples: "PK", "IN", "US", "GB", "AE", "GLOBAL"
     * "GLOBAL" is a special sentinel value meaning "all countries".
     * Max 10 chars to accommodate custom codes like "GLOBAL".
     */
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
      maxlength: 10,
    },

    // Full English display name (e.g. "Pakistan", "United States")
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    // ── 2. Lifecycle ──────────────────────────────────────────────────────

    /**
     * Controls whether this country is available for use in the platform.
     * "active"  = available for geo-targeting; visible in admin dropdowns.
     * "inactive"= disabled; existing records keep their countryId but
     *             the country cannot be newly assigned to stores/coupons.
     *
     * Changed from isActive: Boolean to match the status pattern used by
     * all other models (Store, Category, AffiliateNetwork, AmazonDeal).
     * This also fixes the Store pre-validate hook which checks country.status —
     * previously that check was silently broken (country.status was undefined).
     */
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },

    // ── 3. UI & Display ───────────────────────────────────────────────────

    /**
     * Flag representation — either a Unicode emoji ("🇵🇰") or image URL.
     * Displayed in country selection dropdowns and geo-filter chips.
     * Emoji flags are preferred (no image request overhead).
     */
    flag: {
      type: String,
      trim: true,
      default: "",
      maxlength: 200,
    },

    /**
     * Marks high-traffic countries for prominent placement in dropdowns.
     * Popular countries float to the top of the country selector list.
     * Examples: US, GB, IN, PK, AE.
     */
    isPopular: {
      type: Boolean,
      default: false,
      index: true,
    },

    /**
     * Manual display ordering within each tier (popular vs regular).
     * Lower number = displayed first. Default 0 = natural sort by name.
     */
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },

    // ── 4. Currency ───────────────────────────────────────────────────────

    /**
     * ISO 4217 currency code (e.g. "PKR", "USD", "GBP", "INR").
     * Used to display deal prices in the local currency on the frontend.
     * The platform does not do FX conversion — this is display metadata only.
     */
    currencyCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: "USD",
      maxlength: 10,
    },

    /**
     * Currency symbol for inline price display (e.g. "₨", "$", "£", "₹").
     * Stored separately because it cannot always be reliably derived from
     * currencyCode without a full i18n library.
     */
    currencySymbol: {
      type: String,
      trim: true,
      default: "$",
      maxlength: 10,
    },

    // ── 5. Locale ─────────────────────────────────────────────────────────

    /**
     * IANA timezone identifier (e.g. "Asia/Karachi", "America/New_York").
     * Used to display deal expiry times in the user's local timezone.
     * Reference: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
     */
    timezone: {
      type: String,
      trim: true,
      default: "UTC",
      maxlength: 60,
    },
  },
  { timestamps: true },
);

// ─── Pre-validate Normalization ───────────────────────────────────────────────

CountrySchema.pre("validate", function () {
  if (this.code) this.code = String(this.code).trim().toUpperCase();
  if (this.name) this.name = String(this.name).trim();
  if (this.currencyCode)
    this.currencyCode = String(this.currencyCode).trim().toUpperCase();
  if (this.currencySymbol)
    this.currencySymbol = String(this.currencySymbol).trim();
  if (this.timezone) this.timezone = String(this.timezone).trim();
});

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Dropdown query: active countries, popular first, then sorted by order
CountrySchema.index({ status: 1, sortOrder: 1, isPopular: -1 });

// ─── Export ───────────────────────────────────────────────────────────────────

export default mongoose.models.Country ||
  mongoose.model("Country", CountrySchema);
