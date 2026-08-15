/**
 * @model GeoFirewall
 * @description Manages geographic and IP-based access control rules.
 * Designed to be consumed by Next.js Middleware (via Edge Config or Redis Cache)
 * to block bad actors, click-fraud farms, or restrict region-specific affiliate links.
 *
 * Audit considerations applied:
 * - blockType enum: Differentiates between Country codes and specific IPs.
 * - scope enum: Allows blocking the entire platform ("global") or just specific paths ("routes").
 * - action enum: Gives the option to return a hard 403 ("block") or softly "redirect" users to a fallback page.
 * - Normalized country codes (uppercase) to perfectly match Next.js `req.geo.country`.
 */

import mongoose from "mongoose";

const { Schema } = mongoose;

const GeoFirewallSchema = new Schema(
  {
    // ── 1. Rule Identity ──────────────────────────────────────────────────

    // Internal name for the admin panel (e.g., "Block Russian Bots", "Restrict US Deals")
    ruleName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    // ── 2. Target Definition ──────────────────────────────────────────────

    /**
     * What are we blocking?
     * "country" = ISO Alpha-2 code (matches Next.js req.geo.country)
     * "ip_address" = Specific malicious IP
     * "asn_cidr" = Block an entire server farm/subnet
     */
    blockType: {
      type: String,
      enum: ["country", "ip_address", "asn_cidr"],
      required: true,
      index: true,
    },

    /**
     * The actual value to match against.
     * If blockType is "country", value must be "US", "IN", "RU", etc.
     * If "ip_address", value must be valid IP like "192.168.1.1".
     */
    value: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    // ── 3. Action & Enforcement ───────────────────────────────────────────

    /**
     * How should the Next.js middleware respond?
     * "block" = Return a fast 403 Forbidden response.
     * "redirect" = Send the user to a "Not Available" or fallback page.
     */
    action: {
      type: String,
      enum: ["block", "redirect"],
      default: "block",
    },

    // Where to send the user if action === "redirect"
    redirectUrl: {
      type: String,
      trim: true,
      default: "",
    },

    // ── 4. Scope (Where does this apply?) ─────────────────────────────────

    /**
     * "global" = Blocks access to the entire website (e.g., Sociantech.com).
     * "routes" = Only blocks access to specific paths (e.g., /admin).
     */
    scope: {
      type: String,
      enum: ["global", "routes"],
      default: "global",
    },

    /**
     * Array of Next.js route paths to block if scope === "routes".
     * Example: ["/admin", "/api/private", "/store/us-exclusive"]
     */
    targetRoutes: [
      {
        type: String,
        trim: true,
      },
    ],

    // ── 5. Lifecycle & Audit ──────────────────────────────────────────────

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },

    // Internal note explaining why this block was added (e.g., "High chargeback rate")
    reason: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

// ─── Pre-save Hook: Normalization ─────────────────────────────────────────────

GeoFirewallSchema.pre("save", function () {
  // If we are blocking a country, ensure it perfectly matches Vercel/Next.js req.geo.country format (Uppercase)
  if (this.blockType === "country" && this.value) {
    this.value = String(this.value).trim().toUpperCase();
  }

  // Clear redirectUrl if action is "block" to keep data clean
  if (this.action === "block") {
    this.redirectUrl = "";
  }

  // Clear targetRoutes if scope is "global"
  if (this.scope === "global") {
    this.targetRoutes = [];
  } else if (this.scope === "routes" && Array.isArray(this.targetRoutes)) {
    // Ensure all routes start with a forward slash
    this.targetRoutes = this.targetRoutes.map((route) => {
      let r = route.trim();
      return r.startsWith("/") ? r : `/${r}`;
    });
  }
});

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Fast lookup for the middleware caching pipeline: "Get all active rules"
GeoFirewallSchema.index({ status: 1, blockType: 1, value: 1 });

// ─── Export ───────────────────────────────────────────────────────────────────

export default mongoose.models.GeoFirewall ||
  mongoose.model("GeoFirewall", GeoFirewallSchema);
