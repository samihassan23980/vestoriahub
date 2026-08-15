/**
 * @model AffiliateNetwork
 * @description Manages affiliate/partner networks (e.g. Awin, CJ, Impact, Skimlinks).
 * Each Store links to one AffiliateNetwork. Tracking params are templated strings
 * resolved at redirect time by the affiliate service layer.
 *
 * Audit fixes applied:
 *  - trackingParams validator upgraded to regex (proper placeholder detection)
 *  - Commission & payout fields added for revenue tracking
 *  - Contact info fields added for account management
 *  - cookieDays max: 365 enforced
 *  - websiteUrl field added
 *  - status enum extended with "pending" for new unapproved networks
 *  - owner field trim enforced in pre-validate (was missing)
 */

import mongoose from "mongoose";

const { Schema } = mongoose;

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Validates that a string is a reachable http/https URL */
function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// ─── Schema ─────────────────────────────────────────────────────────────────

const AffiliateNetworkSchema = new Schema(
  {
    // Unique display name for this network (used in admin dropdowns)
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
      maxlength: 120,
    },

    // Parent company / owner of this network (e.g. "Awin Limited")
    owner: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
    },

    // Network homepage — used for admin reference & verification links
    websiteUrl: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: (v) => !v || isValidUrl(v),
        message: "websiteUrl must be a valid http/https URL.",
      },
    },

    /**
     * Lifecycle status of this network integration.
     * "pending" = credentials obtained but not yet live/tested.
     * "active"  = live, stores can be linked.
     * "inactive"= paused (e.g. network suspended our account).
     */
    status: {
      type: String,
      enum: ["pending", "active", "inactive"],
      default: "active",
      index: true,
    },

    /**
     * Affiliate URL tracking parameter template.
     * Must contain at least one {placeholder} so the service layer
     * can inject dynamic values (subId, clickId, etc.) at redirect time.
     * Example: "subid={subId}&clickid={clickId}&source={source}"
     */
    trackingParams: {
      type: String,
      trim: true,
      maxlength: 300,
      validate: {
        // Require at least one valid {camelCase} or {snake_case} placeholder
        validator: (v) => /\{[a-zA-Z_][a-zA-Z0-9_]*\}/.test(v),
        message:
          "trackingParams must contain at least one valid placeholder e.g. {subId}",
      },
    },

    /**
     * Cookie window in days for this network's attribution model.
     * 0 = session-only cookie. Max 365 days (1 year).
     */
    cookieDays: {
      type: Number,
      min: 0,
      max: 365,
      default: 30,
    },

    // ── Commission & Revenue Tracking ──────────────────────────────────────

    /**
     * Default commission rate as a percentage (e.g. 8 = 8%).
     * Stored as a number for query comparisons (find networks with rate > 5%).
     * Actual rate per-store may differ; this is the network baseline.
     */
    commissionRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    /**
     * Payment cycle description (e.g. "Net-30", "Net-60", "Weekly").
     * Free-text because each network has unique payment terms.
     */
    paymentTerms: {
      type: String,
      trim: true,
      default: "",
      maxlength: 100,
    },

    /**
     * Minimum payout threshold in USD before the network pays out.
     * Used for cash-flow forecasting in the admin dashboard.
     */
    minPayoutUsd: {
      type: Number,
      min: 0,
      default: 0,
    },

    // ── Account Management Contact ──────────────────────────────────────────

    // Primary contact email for this network's account manager
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      maxlength: 200,
    },

    // Name of the dedicated account manager at this network (if any)
    accountManagerName: {
      type: String,
      trim: true,
      default: "",
      maxlength: 140,
    },
  },
  { timestamps: true },
);

// ─── Pre-validate Normalization ──────────────────────────────────────────────

AffiliateNetworkSchema.pre("validate", function () {
  // Normalize strings — trim + consistent casing
  if (this.name) this.name = String(this.name).trim();
  if (this.owner) this.owner = String(this.owner).trim();
  if (this.websiteUrl) this.websiteUrl = String(this.websiteUrl).trim();
  if (this.contactEmail)
    this.contactEmail = String(this.contactEmail).trim().toLowerCase();
  if (this.trackingParams)
    this.trackingParams = String(this.trackingParams).trim();
});

// ─── Indexes ─────────────────────────────────────────────────────────────────

// Admin listing: filter by status, order by name
AffiliateNetworkSchema.index({ status: 1, name: 1 });

// ─── Export ──────────────────────────────────────────────────────────────────

export default mongoose.models.AffiliateNetwork ||
  mongoose.model("AffiliateNetwork", AffiliateNetworkSchema);
